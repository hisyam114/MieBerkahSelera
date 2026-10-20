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
  
  // Get today's date in script timezone
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  
  let startDate, endDate;
  
  switch(period) {
    case 'today':
      startDate = new Date(year, month, day);
      endDate = new Date(year, month, day, 23, 59, 59);
      break;
    case 'week':
      startDate = new Date(year, month, day - 6); // 7 days including today
      endDate = new Date(year, month, day, 23, 59, 59);
      break;
    case 'month':
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59);
      break;
    case 'year':
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
      break;
    default:
      return createResponse(false, 'Invalid period');
  }
  
  // Calculate income - sum ALL rows in date range
  let totalIncome = 0;
  const incomeData = incomeSheet.getDataRange().getValues();
  
  for (let i = 1; i < incomeData.length; i++) {
    const row = incomeData[i];
    const dateCell = row[1]; // Column B: tanggal
    
    // Skip empty rows
    if (!dateCell) continue;
    
    // Get income amount from column E (total_pemasukan) or calculate from C+D
    let amount = row[4]; // Column E
    if (!amount || amount === '') {
      // Fallback: calculate from cash + qris
      const cash = Number(row[2]) || 0; // Column C
      const qris = Number(row[3]) || 0; // Column D
      amount = cash + qris;
    }
    
    if (amount && amount !== 0) {
      // Convert date to comparable format
      let rowDate = new Date(dateCell);
      
      // Compare dates
      if (rowDate >= startDate && rowDate <= endDate) {
        totalIncome += Number(amount);
      }
    }
  }
  
  // Calculate expense - sum ALL rows in date range
  let totalExpense = 0;
  const expenseData = expenseSheet.getDataRange().getValues();
  
  for (let i = 1; i < expenseData.length; i++) {
    const row = expenseData[i];
    const dateCell = row[1]; // Column B: tanggal
    
    // Skip empty rows
    if (!dateCell) continue;
    
    // Get expense amount from column I (total_biaya) or calculate from F*H
    let amount = row[8]; // Column I
    if (!amount || amount === '') {
      // Fallback: calculate from qty * price
      const qty = Number(row[5]) || 0; // Column F
      const price = Number(row[7]) || 0; // Column H
      amount = qty * price;
    }
    
    if (amount && amount !== 0) {
      // Convert date to comparable format
      let rowDate = new Date(dateCell);
      
      // Compare dates
      if (rowDate >= startDate && rowDate <= endDate) {
        totalExpense += Number(amount);
      }
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a standardized JSON response with CORS headers
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
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
  
  Logger.log('\n3. Testing Dashboard...');
  const dashboardResult = handleGetDashboard({ period: 'today' });
  Logger.log('Dashboard Response: ' + dashboardResult.getContent());
  
  Logger.log('\n=== ALL TESTS COMPLETED ===');
  Logger.log('If you see "success":true for all tests, your API is working!');
  Logger.log('Next step: Deploy as Web App');
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
