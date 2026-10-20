/**
 * Mie Ayam Financial Recording - Google Apps Script Backend API
 * 
 * This script serves as a REST API endpoint for the financial recording web application.
 * It handles authentication, data retrieval, and data insertion for income and expense logging.
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open Google Sheets: https://docs.google.com/spreadsheets/d/13RxW3a6eqGzNFSExhcXbb8l0p1waoqCGUW7dkhB2fRs/edit
 * 2. Go to Extensions → Apps Script
 * 3. Delete any default code
 * 4. Copy-paste this entire file
 * 5. Click Deploy → New deployment
 * 6. Select "Web app" type
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Click Deploy and copy the Web App URL
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const SPREADSHEET_ID = '13RxW3a6eqGzNFSExhcXbb8l0p1waoqCGUW7dkhB2fRs';

const SHEET_NAMES = {
  INCOME: 'Pemasukan_Harian',
  EXPENSE: 'Pengeluaran',
  MASTER_ITEMS: 'Master_Barang',
  USERS: 'Users',
  DASHBOARD: 'Dashboard'
};

// ============================================================================
// MAIN HTTP HANDLERS
// ============================================================================

/**
 * Handles HTTP GET requests
 * Routes: /login, /master-items, /dashboard
 */
function doGet(e) {
  try {
    // Handle CORS preflight
    if (!e || !e.parameter) {
      return createResponse(true, 'API is running');
    }
    
    const action = e.parameter.action;
    
    if (!action) {
      return createResponse(false, 'Action parameter is required');
    }
    
    switch(action) {
      case 'login':
        return handleLogin(e.parameter);
      
      case 'master-items':
        return handleGetMasterItems();
      
      case 'dashboard':
        return handleGetDashboard(e.parameter);
      
      default:
        return createResponse(false, 'Invalid action');
    }
    
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return createResponse(false, 'Server error: ' + error.message);
  }
}

/**
 * Handles HTTP POST requests
 * Routes: /income, /expense
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    
    if (!action) {
      return createResponse(false, 'Action parameter is required');
    }
    
    // Get data from form parameters (not JSON body)
    const data = e.parameter;
    
    switch(action) {
      case 'income':
        return handleAddIncome(data);
      
      case 'expense':
        return handleAddExpense(data);
      
      default:
        return createResponse(false, 'Invalid action');
    }
    
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return createResponse(false, 'Server error: ' + error.message);
  }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Authenticates user with username and PIN
 * @param {Object} params - Contains username and pin
 * @returns {Object} JSON response with user data or error
 */
function handleLogin(params) {
  const username = params.username;
  const pin = params.pin;
  
  if (!username || !pin) {
    return createResponse(false, 'Username and PIN are required');
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const usersSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  const data = usersSheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dbUsername = row[0]; // Column A
    const dbPin = String(row[1]); // Column B
    const namaLengkap = row[2]; // Column C
    const role = row[3]; // Column D
    const status = row[4]; // Column E
    
    if (dbUsername === username && dbPin === pin) {
      if (status !== 'Aktif') {
        return createResponse(false, 'User account is inactive');
      }
      
      return createResponse(true, 'Login successful', {
        username: username,
        nama_lengkap: namaLengkap,
        role: role
      });
    }
  }
  
  return createResponse(false, 'Invalid username or PIN');
}

// ============================================================================
// INCOME HANDLERS
// ============================================================================

/**
 * Adds a new income record to Pemasukan_Harian sheet
 * @param {Object} data - Income data from frontend
 * @returns {Object} JSON response
 */
function handleAddIncome(data) {
  const { tanggal, total_cash, total_qris, keterangan, created_by } = data;
  
  // Validation
  if (!tanggal || total_cash === undefined || total_qris === undefined) {
    return createResponse(false, 'Missing required fields');
  }
  
  const totalPemasukan = Number(total_cash) + Number(total_qris);
  
  // Generate unique ID
  const id = generateIncomeId(tanggal);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const incomeSheet = ss.getSheetByName(SHEET_NAMES.INCOME);
  
  // Append new row
  incomeSheet.appendRow([
    id,
    tanggal,
    Number(total_cash),
    Number(total_qris),
    totalPemasukan,
    keterangan || '',
    created_by || 'system'
  ]);
  
  return createResponse(true, 'Income recorded successfully', {
    id: id,
    total_pemasukan: totalPemasukan
  });
}

/**
 * Generates unique income ID (INC-YYYYMMDD)
 */
function generateIncomeId(tanggal) {
  const date = new Date(tanggal);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `INC-${year}${month}${day}`;
}

// ============================================================================
// EXPENSE HANDLERS
// ============================================================================

/**
 * Adds a new expense record to Pengeluaran sheet
 * @param {Object} data - Expense data from frontend
 * @returns {Object} JSON response
 */
function handleAddExpense(data) {
  const { tanggal, jam, nama_barang, kategori, qty, satuan, harga_satuan, keterangan, created_by } = data;
  
  // Validation
  if (!tanggal || !nama_barang || !qty || !harga_satuan) {
    return createResponse(false, 'Missing required fields');
  }
  
  const totalBiaya = Number(qty) * Number(harga_satuan);
  
  // Generate unique ID
  const id = generateExpenseId(tanggal);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const expenseSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE);
  
  // Append new row
  expenseSheet.appendRow([
    id,
    tanggal,
    jam || '',
    nama_barang,
    kategori || '',
    Number(qty),
    satuan || '',
    Number(harga_satuan),
    totalBiaya,
    keterangan || '',
    created_by || 'system'
  ]);
  
  return createResponse(true, 'Expense recorded successfully', {
    id: id,
    total_biaya: totalBiaya
  });
}

/**
 * Generates unique expense ID (EXP-YYYYMMDD-NNN)
 */
function generateExpenseId(tanggal) {
  const date = new Date(tanggal);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const expenseSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE);
  const data = expenseSheet.getDataRange().getValues();
  
  // Count existing expenses for today
  const prefix = `EXP-${year}${month}${day}`;
  let count = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).startsWith(prefix)) {
      count++;
    }
  }
  
  const sequence = String(count + 1).padStart(3, '0');
  return `${prefix}-${sequence}`;
}

// ============================================================================
// MASTER DATA HANDLERS
// ============================================================================

/**
 * Retrieves all items from Master_Barang sheet
 * @returns {Object} JSON response with items array
 */
function handleGetMasterItems() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_ITEMS);
  const data = masterSheet.getDataRange().getValues();
  
  const items = [];
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Only include rows with ID
      items.push({
        id_barang: row[0],
        nama_barang: row[1],
        kategori: row[2],
        satuan: row[3]
      });
    }
  }
  
  return createResponse(true, 'Master items retrieved successfully', { items: items });
}

// ============================================================================
// DASHBOARD HANDLERS
// ============================================================================

/**
 * Retrieves dashboard summary data by calculating directly from data sheets
 * @param {Object} params - Contains period filter (today, week, month, year)
 * @returns {Object} JSON response with financial summary
 */
function handleGetDashboard(params) {
  const period = params.period || 'today';
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const incomeSheet = ss.getSheetByName(SHEET_NAMES.INCOME);
  const expenseSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE);
  const dashboardSheet = ss.getSheetByName(SHEET_NAMES.DASHBOARD);
  
  // Get spreadsheet timezone (defaults to Asia/Jakarta)
  const tz = ss.getSpreadsheetTimeZone() || 'Asia/Jakarta';
  
  // Get date range based on period in the spreadsheet timezone
  const dateRange = getPeriodDateRange(period, tz);
  if (!dateRange) {
    return createResponse(false, 'Invalid period');
  }
  
  const { startDate, endDate } = dateRange;
  
  // 1. Calculate directly from Pemasukan_Harian and Pengeluaran sheets
  let totalIncome = 0;
  if (incomeSheet) {
    const incomeData = incomeSheet.getDataRange().getValues();
    for (let i = 1; i < incomeData.length; i++) {
      const row = incomeData[i];
      const dateCell = row[1]; // Column B: tanggal
      if (!dateCell) continue;
      
      const rowDate = parseCellDate(dateCell, tz);
      if (!rowDate) continue;
      
      // Amount from column E (total_pemasukan) or column C + column D
      let amount = cleanAmount(row[4]);
      if (!amount) {
        amount = cleanAmount(row[2]) + cleanAmount(row[3]);
      }
      
      if (rowDate >= startDate && rowDate <= endDate) {
        totalIncome += amount;
      }
    }
  }
  
  let totalExpense = 0;
  if (expenseSheet) {
    const expenseData = expenseSheet.getDataRange().getValues();
    for (let i = 1; i < expenseData.length; i++) {
      const row = expenseData[i];
      const dateCell = row[1]; // Column B: tanggal
      if (!dateCell) continue;
      
      const rowDate = parseCellDate(dateCell, tz);
      if (!rowDate) continue;
      
      // Amount from column I (total_biaya) or column F * column H
      let amount = cleanAmount(row[8]);
      if (!amount) {
        amount = cleanAmount(row[5]) * cleanAmount(row[7]);
      }
      
      if (rowDate >= startDate && rowDate <= endDate) {
        totalExpense += amount;
      }
    }
  }
  
  // 2. Fallback: If both direct calculations are 0, check Dashboard sheet formulas/values
  if (totalIncome === 0 && totalExpense === 0 && dashboardSheet) {
    const fallbackData = readFromDashboardSheet(dashboardSheet, period);
    if (fallbackData) {
      totalIncome = fallbackData.income;
      totalExpense = fallbackData.expense;
    }
  }
  
  const profit = totalIncome - totalExpense;
  
  return createResponse(true, 'Dashboard data retrieved successfully', {
    period: period,
    income: totalIncome,
    expense: totalExpense,
    profit: profit
  });
}

/**
 * Calculates start and end Date for a given period in specified timezone
 */
function getPeriodDateRange(period, tz) {
  const now = new Date();
  const todayYmd = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const parts = todayYmd.split('-');
  const curYear = parseInt(parts[0], 10);
  const curMonth = parseInt(parts[1], 10) - 1; // 0-based
  const curDay = parseInt(parts[2], 10);
  
  const todayStart = new Date(Date.UTC(curYear, curMonth, curDay, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));
  
  switch(period) {
    case 'today':
      return { startDate: todayStart, endDate: todayEnd };
    case 'week':
      return {
        startDate: new Date(Date.UTC(curYear, curMonth, curDay - 6, 0, 0, 0)),
        endDate: todayEnd
      };
    case 'month':
      return {
        startDate: new Date(Date.UTC(curYear, curMonth, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(curYear, curMonth + 1, 0, 23, 59, 59, 999))
      };
    case 'year':
      return {
        startDate: new Date(Date.UTC(curYear, 0, 1, 0, 0, 0)),
        endDate: new Date(Date.UTC(curYear, 11, 31, 23, 59, 59, 999))
      };
    default:
      return null;
  }
}

/**
 * Parses any date format (Date object, DD/MM/YYYY, YYYY-MM-DD, etc.) into UTC normalized Date
 */
function parseCellDate(dateVal, tz) {
  if (!dateVal) return null;
  
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return null;
    try {
      const ymd = Utilities.formatDate(dateVal, tz, 'yyyy-MM-dd');
      const parts = ymd.split('-');
      return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
    } catch (e) {
      return new Date(Date.UTC(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate()));
    }
  }
  
  const str = String(dateVal).trim();
  if (!str) return null;
  
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    return new Date(Date.UTC(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)));
  }
  
  // YYYY-MM-DD or YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    return new Date(Date.UTC(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10)));
  }
  
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  
  return null;
}

/**
 * Cleans numerical value or Indonesian formatted currency string (e.g. "Rp1.270.000")
 */
function cleanAmount(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  
  let str = String(val).trim();
  str = str.replace(/^[^\d\-]+/, '').trim();
  
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes('.')) {
    const dotParts = str.split('.');
    if (dotParts.length > 2 || (dotParts.length === 2 && dotParts[1].length === 3)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  
  const cleaned = str.replace(/[^0-9\-\.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Fallback parser to read from Dashboard sheet directly
 */
function readFromDashboardSheet(dashboardSheet, period) {
  try {
    const data = dashboardSheet.getDataRange().getValues();
    const map = {};
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const label = String(row[0] || '').toLowerCase().trim();
      // Value can be in Column B (index 1) or Column C (index 2)
      const val = cleanAmount(row[1]) || cleanAmount(row[2]) || 0;
      if (label) {
        map[label] = val;
      }
    }
    
    const periodKeywords = {
      today: 'hari ini',
      week: 'minggu ini',
      month: 'bulan ini',
      year: 'tahun ini'
    };
    
    const kw = periodKeywords[period];
    if (!kw) return null;
    
    let income = 0;
    let expense = 0;
    
    for (const [key, val] of Object.entries(map)) {
      if (key.includes(kw)) {
        if (key.includes('pemasukan') || key.includes('income')) {
          income = val;
        } else if (key.includes('pengeluaran') || key.includes('expense')) {
          expense = val;
        }
      }
    }
    
    if (income > 0 || expense > 0) {
      return { income: income, expense: expense };
    }
  } catch (e) {
    Logger.log('readFromDashboardSheet error: ' + e.message);
  }
  return null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a standardized JSON response
 * @param {boolean} success - Whether the request was successful
 * @param {string} message - Response message
 * @param {Object} data - Optional data payload
 * @returns {ContentService.TextOutput} JSON response
 */
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// TEST FUNCTIONS (For development only)
// ============================================================================

/**
 * Test function to verify API endpoints
 * Run this in Apps Script editor to test basic functionality
 */
function testAPI() {
  Logger.log('=== TESTING MIE AYAM FINANCIAL API ===\n');
  
  Logger.log('1. Testing Login...');
  const loginResult = handleLogin({ username: 'admin', pin: '123456' });
  Logger.log('Login Response: ' + loginResult.getContent());
  
  Logger.log('\n2. Testing Master Items...');
  const itemsResult = handleGetMasterItems();
  Logger.log('Master Items Response: ' + itemsResult.getContent());
  
  Logger.log('\n3. Testing Dashboard (Today)...');
  const dashboardToday = handleGetDashboard({ period: 'today' });
  Logger.log('Today Response: ' + dashboardToday.getContent());
  
  Logger.log('\n4. Testing Dashboard (Month)...');
  const dashboardMonth = handleGetDashboard({ period: 'month' });
  Logger.log('Month Response: ' + dashboardMonth.getContent());
  
  Logger.log('\n=== ALL TESTS COMPLETED ===');
  Logger.log('If you see correct non-zero income/expense for today/month, API is working perfectly!');
  Logger.log('Next step: Deploy as Web App -> New version');
}

/**
 * Simple test to verify Sheets connection
 */
function testSheetsConnection() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Connected to Google Sheets successfully!');
    Logger.log('Sheet name: ' + ss.getName());
    
    // Test each sheet
    const sheets = ['Users', 'Pemasukan_Harian', 'Pengeluaran', 'Master_Barang', 'Dashboard'];
    sheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        Logger.log('✅ Found sheet: ' + sheetName + ' (' + sheet.getLastRow() + ' rows)');
      } else {
        Logger.log('❌ Missing sheet: ' + sheetName);
      }
    });
    
    return 'Connection test passed!';
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    return 'Connection test failed!';
  }
}
