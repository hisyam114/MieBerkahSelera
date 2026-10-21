const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const SPREADSHEET_ID = '13RxW3a6eqGzNFSExhcXbb8l0p1waoqCGUW7dkhB2fRs';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function fetchSheetCSV(sheetName) {
  return new Promise((resolve, reject) => {
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    https.get(sheetUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  return lines.map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  });
}

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

function parseCellDate(dateVal) {
  if (!dateVal) return null;
  const str = String(dateVal).trim();
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    return new Date(Date.UTC(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)));
  }
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

function getPeriodRange(period) {
  // Use UTC based on Asia/Jakarta (UTC+7)
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth();
  const curDay = now.getUTCDate();

  const todayStart = new Date(Date.UTC(curYear, curMonth, curDay, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(curYear, curMonth, curDay, 23, 59, 59, 999));

  switch (period) {
    case 'today':
      return { start: todayStart, end: todayEnd };
    case 'week':
      return {
        start: new Date(Date.UTC(curYear, curMonth, curDay - 6, 0, 0, 0)),
        end: todayEnd
      };
    case 'month':
      return {
        start: new Date(Date.UTC(curYear, curMonth, 1, 0, 0, 0)),
        end: new Date(Date.UTC(curYear, curMonth + 1, 0, 23, 59, 59, 999))
      };
    case 'year':
      return {
        start: new Date(Date.UTC(curYear, 0, 1, 0, 0, 0)),
        end: new Date(Date.UTC(curYear, 11, 31, 23, 59, 59, 999))
      };
    default:
      return null;
  }
}

async function handleApi(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const action = parsedUrl.query.action;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    if (action === 'login') {
      const { username, pin } = parsedUrl.query;
      const csv = await fetchSheetCSV('Users');
      const rows = parseCSV(csv);
      for (let i = 1; i < rows.length; i++) {
        const [u, p, name, role, status] = rows[i];
        if (u === username && String(p) === String(pin)) {
          if (status !== 'Aktif') {
            return res.end(JSON.stringify({ success: false, message: 'User account is inactive' }));
          }
          return res.end(JSON.stringify({
            success: true,
            message: 'Login successful',
            data: { username: u, nama_lengkap: name, role: role }
          }));
        }
      }
      return res.end(JSON.stringify({ success: false, message: 'Invalid username or PIN' }));
    }

    if (action === 'master-items') {
      const csv = await fetchSheetCSV('Master_Barang');
      const rows = parseCSV(csv);
      const items = [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0]) {
          items.push({
            id_barang: rows[i][0],
            nama_barang: rows[i][1],
            kategori: rows[i][2],
            satuan: rows[i][3]
          });
        }
      }
      return res.end(JSON.stringify({ success: true, message: 'Master items retrieved', data: { items } }));
    }

    if (action === 'dashboard') {
      const period = parsedUrl.query.period || 'today';
      const range = getPeriodRange(period);
      if (!range) {
        return res.end(JSON.stringify({ success: false, message: 'Invalid period' }));
      }

      const [incomeCsv, expenseCsv] = await Promise.all([
        fetchSheetCSV('Pemasukan_Harian'),
        fetchSheetCSV('Pengeluaran')
      ]);

      const incomeRows = parseCSV(incomeCsv);
      const expenseRows = parseCSV(expenseCsv);

      let totalIncome = 0;
      const allIncomes = [];
      for (let i = 1; i < incomeRows.length; i++) {
        const row = incomeRows[i];
        if (!row[1]) continue;
        const date = parseCellDate(row[1]);
        const cash = cleanAmount(row[2]);
        const qris = cleanAmount(row[3]);
        let amount = cleanAmount(row[4]);
        if (!amount) amount = cash + qris;

        const formattedDate = date ? date.toISOString().split('T')[0] : String(row[1] || '');
        allIncomes.push({
          id: String(row[0] || ('INC-' + i)),
          tanggal: formattedDate,
          total_cash: cash,
          total_qris: qris,
          total_pemasukan: amount,
          keterangan: String(row[5] || ''),
          created_by: String(row[6] || '')
        });

        if (date && date >= range.start && date <= range.end) {
          totalIncome += amount;
        }
      }

      let totalExpense = 0;
      const allExpenses = [];
      for (let i = 1; i < expenseRows.length; i++) {
        const row = expenseRows[i];
        if (!row[1]) continue;
        const date = parseCellDate(row[1]);
        const qty = cleanAmount(row[5]);
        const harga = cleanAmount(row[7]);
        let amount = cleanAmount(row[8]);
        if (!amount) amount = qty * harga;

        const formattedDate = date ? date.toISOString().split('T')[0] : String(row[1] || '');
        allExpenses.push({
          id: String(row[0] || ('EXP-' + i)),
          tanggal: formattedDate,
          jam: String(row[2] || ''),
          nama_barang: String(row[3] || ''),
          kategori: String(row[4] || ''),
          qty: qty,
          satuan: String(row[6] || ''),
          harga_satuan: harga,
          total_biaya: amount,
          keterangan: String(row[9] || ''),
          created_by: String(row[10] || '')
        });

        if (date && date >= range.start && date <= range.end) {
          totalExpense += amount;
        }
      }

      return res.end(JSON.stringify({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          period: period,
          income: totalIncome,
          expense: totalExpense,
          profit: totalIncome - totalExpense,
          incomes: allIncomes,
          expenses: allExpenses
        }
      }));
    }

    res.end(JSON.stringify({ success: false, message: 'Unknown action' }));
  } catch (err) {
    console.error('API Error:', err);
    res.end(JSON.stringify({ success: false, message: err.message }));
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  if (parsedUrl.pathname === '/api') {
    return handleApi(req, res);
  }

  let reqPath = parsedUrl.pathname;
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
