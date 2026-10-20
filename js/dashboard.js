/**
 * Dashboard Page Logic
 * Handles period switching, KPI display, dynamic Chart.js visualizations,
 * and filtered transaction tables (Pemasukan & Pengeluaran)
 */

// Check admin access
Auth.requireAdmin();

// Display user name
const user = Auth.getCurrentUser();
if (user && document.getElementById('userName')) {
  document.getElementById('userName').textContent = user.nama_lengkap || user.username || 'Owner';
}

// Current state
let currentPeriod = 'today';
let rawIncomes = [];
let rawExpenses = [];
let currentTableTab = 'income'; // 'income' or 'expense'
let filterStartDate = null;
let filterEndDate = null;
let searchQuery = '';

// Chart reference
let financialChart = null;

// Auto-refresh interval reference (5 seconds)
let refreshInterval = null;
let isInitialLoad = true;

// Helper: Format Currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0);
};

// Helper: Format Date for Display (e.g. 21 Okt 2026)
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '-';
  const str = String(dateStr).trim();
  // If YYYY-MM-DD
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = parseInt(ymd[3], 10);
    const m = months[parseInt(ymd[2], 10) - 1] || ymd[2];
    const y = ymd[1];
    return `${d} ${m} ${y}`;
  }
  return str;
};

// Helper: Category badge styling
const getCategoryBadgeClass = (category) => {
  const cat = String(category || '').toLowerCase();
  if (cat.includes('bahan')) return 'bg-orange-50 text-orange-700 border border-orange-200';
  if (cat.includes('bumbu')) return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (cat.includes('kemasan')) return 'bg-purple-50 text-purple-700 border border-purple-200';
  if (cat.includes('operasional')) return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (cat.includes('kebersihan')) return 'bg-teal-50 text-teal-700 border border-teal-200';
  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

// Load dashboard data with cache busting
async function loadDashboard(period = currentPeriod) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const incomeValue = document.getElementById('incomeValue');
  const expenseValue = document.getElementById('expenseValue');
  const profitValue = document.getElementById('profitValue');
  const profitContainer = document.getElementById('profitCardContainer');
  
  try {
    // Show loading overlay only on initial page load
    if (isInitialLoad && loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
    }
    
    // Fetch data from API with cache busting
    const data = await API.getDashboard(period);
    
    // Update KPI values
    if (incomeValue) incomeValue.textContent = formatCurrency(data.income);
    if (expenseValue) expenseValue.textContent = formatCurrency(data.expense);
    if (profitValue) profitValue.textContent = formatCurrency(data.profit);
    
    // Update profit card styling based on value
    if (profitContainer && profitValue) {
      if (data.profit >= 0) {
        profitContainer.classList.remove('border-rose-500');
        profitContainer.classList.add('border-blue-500');
        profitValue.classList.remove('text-rose-600');
        profitValue.classList.add('text-gray-900');
      } else {
        profitContainer.classList.remove('border-blue-500');
        profitContainer.classList.add('border-rose-500');
        profitValue.classList.remove('text-gray-900');
        profitValue.classList.add('text-rose-600');
      }
    }

    // Save transactions if provided in response
    if (Array.isArray(data.incomes)) {
      rawIncomes = data.incomes;
    }
    if (Array.isArray(data.expenses)) {
      rawExpenses = data.expenses;
    }

    // Render / Update Chart based on current period
    renderFinancialChart(period, data);

    // Render Transaction Tables
    renderTables();
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    if (incomeValue && !incomeValue.textContent) incomeValue.textContent = formatCurrency(0);
    if (expenseValue && !expenseValue.textContent) expenseValue.textContent = formatCurrency(0);
    if (profitValue && !profitValue.textContent) profitValue.textContent = formatCurrency(0);
  } finally {
    // Hide loading overlay after initial load
    if (isInitialLoad && loadingOverlay) {
      loadingOverlay.classList.add('hidden');
      isInitialLoad = false;
    }
  }
}

// ============================================================================
// CHART.JS VISUALIZATION
// ============================================================================

function renderFinancialChart(period, data) {
  const chartCanvas = document.getElementById('financialChart');
  if (!chartCanvas) return;

  const chartTitle = document.getElementById('chartTitle');
  const chartSubtitle = document.getElementById('chartSubtitle');

  const periodNames = {
    today: 'Hari Ini',
    week: '7 Hari Terakhir',
    month: 'Bulan Ini',
    year: 'Tahun Ini'
  };

  if (chartTitle) {
    chartTitle.textContent = `Tren Keuangan - ${periodNames[period] || 'Semua Periode'}`;
  }

  // Build chart configuration based on selected period
  const ctx = chartCanvas.getContext('2d');
  const chartConfig = getChartConfig(period, data);

  if (financialChart) {
    financialChart.data = chartConfig.data;
    financialChart.options = chartConfig.options;
    financialChart.update();
  } else {
    financialChart = new Chart(ctx, chartConfig);
  }
}

function getChartConfig(period, data) {
  const currentIncome = Number(data.income) || 0;
  const currentExpense = Number(data.expense) || 0;

  let labels = [];
  let incomeDataPoints = [];
  let expenseDataPoints = [];
  let chartType = 'bar';

  if (period === 'today') {
    // Breakdown for Today: Cash, QRIS, Total Income, Total Expense, Net Profit
    labels = ['Pemasukan (Cash)', 'Pemasukan (QRIS)', 'Total Pemasukan', 'Total Pengeluaran', 'Laba Bersih'];
    
    // Calculate today's cash & QRIS breakdown from rawIncomes
    const todayStr = new Date().toISOString().split('T')[0];
    let cashToday = 0;
    let qrisToday = 0;
    rawIncomes.forEach(item => {
      if (item.tanggal === todayStr || !item.tanggal) {
        cashToday += Number(item.total_cash) || 0;
        qrisToday += Number(item.total_qris) || 0;
      }
    });

    if (cashToday === 0 && qrisToday === 0 && currentIncome > 0) {
      cashToday = Math.round(currentIncome * 0.7);
      qrisToday = currentIncome - cashToday;
    }

    const netProfit = currentIncome - currentExpense;

    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nominal (Rp)',
          data: [cashToday, qrisToday, currentIncome, currentExpense, netProfit],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',   // Green Cash
            'rgba(20, 184, 166, 0.8)',  // Teal QRIS
            'rgba(16, 185, 129, 0.9)',  // Emerald Total
            'rgba(239, 68, 68, 0.85)',  // Red Expense
            netProfit >= 0 ? 'rgba(59, 130, 246, 0.85)' : 'rgba(239, 68, 68, 0.9)' // Blue/Red Profit
          ],
          borderColor: [
            '#16a34a',
            '#0d9488',
            '#059669',
            '#dc2626',
            netProfit >= 0 ? '#2563eb' : '#dc2626'
          ],
          borderWidth: 1.5,
          borderRadius: 8
        }]
      },
      options: getCommonChartOptions()
    };
  }

  if (period === 'week') {
    // Last 7 days
    const dayLabels = [];
    const dateKeys = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      dateKeys.push(iso);
      dayLabels.push(display);
    }

    labels = dayLabels;
    incomeDataPoints = dateKeys.map(k => {
      return rawIncomes
        .filter(item => item.tanggal === k)
        .reduce((sum, item) => sum + (Number(item.total_pemasukan) || 0), 0);
    });

    expenseDataPoints = dateKeys.map(k => {
      return rawExpenses
        .filter(item => item.tanggal === k)
        .reduce((sum, item) => sum + (Number(item.total_biaya) || 0), 0);
    });

    // If today has current totals and array is not populated yet, ensure today shows value
    const todayIndex = dateKeys.length - 1;
    if (incomeDataPoints[todayIndex] === 0 && currentIncome > 0) {
      incomeDataPoints[todayIndex] = currentIncome;
    }
    if (expenseDataPoints[todayIndex] === 0 && currentExpense > 0) {
      expenseDataPoints[todayIndex] = currentExpense;
    }
  } else if (period === 'month') {
    // Current month grouped into active days or calendar blocks
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const totalDays = new Date(curYear, curMonth + 1, 0).getDate();

    const dateKeys = [];
    const dayLabels = [];
    for (let i = 1; i <= totalDays; i++) {
      const mStr = String(curMonth + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      dateKeys.push(`${curYear}-${mStr}-${dStr}`);
      dayLabels.push(`${i}`);
    }

    labels = dayLabels;
    incomeDataPoints = dateKeys.map(k => {
      return rawIncomes
        .filter(item => item.tanggal === k)
        .reduce((sum, item) => sum + (Number(item.total_pemasukan) || 0), 0);
    });

    expenseDataPoints = dateKeys.map(k => {
      return rawExpenses
        .filter(item => item.tanggal === k)
        .reduce((sum, item) => sum + (Number(item.total_biaya) || 0), 0);
    });
  } else if (period === 'year') {
    // 12 Months
    labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const curYear = new Date().getFullYear();

    incomeDataPoints = labels.map((_, idx) => {
      const mPrefix = `${curYear}-${String(idx + 1).padStart(2, '0')}`;
      return rawIncomes
        .filter(item => (item.tanggal || '').startsWith(mPrefix))
        .reduce((sum, item) => sum + (Number(item.total_pemasukan) || 0), 0);
    });

    expenseDataPoints = labels.map((_, idx) => {
      const mPrefix = `${curYear}-${String(idx + 1).padStart(2, '0')}`;
      return rawExpenses
        .filter(item => (item.tanggal || '').startsWith(mPrefix))
        .reduce((sum, item) => sum + (Number(item.total_biaya) || 0), 0);
    });
  }

  return {
    type: chartType,
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeDataPoints,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderColor: '#059669',
          borderWidth: 1.5,
          borderRadius: 6
        },
        {
          label: 'Pengeluaran',
          data: expenseDataPoints,
          backgroundColor: 'rgba(239, 68, 68, 0.85)',
          borderColor: '#dc2626',
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    },
    options: getCommonChartOptions()
  };
}

function getCommonChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#6b7280' }
      },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { size: 10 },
          color: '#6b7280',
          callback: function(val) {
            if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1) + 'jt';
            if (val >= 1000) return 'Rp ' + (val / 1000).toFixed(0) + 'rb';
            return 'Rp ' + val;
          }
        }
      }
    }
  };
}

// ============================================================================
// TRANSACTION TABLES & DATE FILTERING
// ============================================================================

function renderTables() {
  renderIncomeTable();
  renderExpenseTable();
}

function renderIncomeTable() {
  const tbody = document.getElementById('incomeTableBody');
  const countBadge = document.getElementById('badgeIncomeCount');
  const tableInfo = document.getElementById('incomeTableInfo');
  const subtotalEl = document.getElementById('incomeSubtotal');
  if (!tbody) return;

  // 1. Filter
  let filtered = rawIncomes.filter(item => {
    // Date filter
    if (filterStartDate && item.tanggal && item.tanggal < filterStartDate) return false;
    if (filterEndDate && item.tanggal && item.tanggal > filterEndDate) return false;
    
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (item.id || '').toLowerCase().includes(q) ||
                    (item.keterangan || '').toLowerCase().includes(q) ||
                    (item.created_by || '').toLowerCase().includes(q) ||
                    (item.tanggal || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // 2. Order by newest date (descending) by default
  filtered.sort((a, b) => {
    const dateA = a.tanggal || '';
    const dateB = b.tanggal || '';
    return dateB.localeCompare(dateA);
  });

  // Update counts
  if (countBadge) countBadge.textContent = filtered.length;
  if (tableInfo) tableInfo.textContent = `Menampilkan ${filtered.length} dari ${rawIncomes.length} transaksi`;

  // Calculate Subtotal
  const subtotal = filtered.reduce((acc, item) => acc + (Number(item.total_pemasukan) || 0), 0);
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-gray-400">
          <div class="flex flex-col items-center justify-center space-y-2">
            <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-sm font-medium">Tidak ada data pemasukan yang cocok</p>
            <p class="text-xs text-gray-400">Coba ganti filter tanggal atau kata kunci pencarian</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((item, idx) => {
    return `
      <tr class="hover:bg-green-50/40 transition">
        <td class="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
          ${formatDateDisplay(item.tanggal)}
        </td>
        <td class="py-3 px-4 text-xs font-mono text-gray-500">
          ${item.id || '-'}
        </td>
        <td class="py-3 px-4 text-right text-gray-700">
          ${formatCurrency(item.total_cash)}
        </td>
        <td class="py-3 px-4 text-right text-teal-700 font-medium">
          ${formatCurrency(item.total_qris)}
        </td>
        <td class="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
          <span class="bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/80">
            ${formatCurrency(item.total_pemasukan)}
          </span>
        </td>
        <td class="py-3 px-4 text-gray-600 max-w-xs truncate text-xs" title="${item.keterangan || '-'}">
          ${item.keterangan || '-'}
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            ${item.created_by || 'kasir'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderExpenseTable() {
  const tbody = document.getElementById('expenseTableBody');
  const countBadge = document.getElementById('badgeExpenseCount');
  const tableInfo = document.getElementById('expenseTableInfo');
  const subtotalEl = document.getElementById('expenseSubtotal');
  if (!tbody) return;

  // 1. Filter
  let filtered = rawExpenses.filter(item => {
    // Date filter
    if (filterStartDate && item.tanggal && item.tanggal < filterStartDate) return false;
    if (filterEndDate && item.tanggal && item.tanggal > filterEndDate) return false;
    
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (item.id || '').toLowerCase().includes(q) ||
                    (item.nama_barang || '').toLowerCase().includes(q) ||
                    (item.kategori || '').toLowerCase().includes(q) ||
                    (item.keterangan || '').toLowerCase().includes(q) ||
                    (item.created_by || '').toLowerCase().includes(q) ||
                    (item.tanggal || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // 2. Order by newest date (descending) by default
  filtered.sort((a, b) => {
    const dateA = (a.tanggal || '') + ' ' + (a.jam || '00:00');
    const dateB = (b.tanggal || '') + ' ' + (b.jam || '00:00');
    return dateB.localeCompare(dateA);
  });

  // Update counts
  if (countBadge) countBadge.textContent = filtered.length;
  if (tableInfo) tableInfo.textContent = `Menampilkan ${filtered.length} dari ${rawExpenses.length} transaksi`;

  // Calculate Subtotal
  const subtotal = filtered.reduce((acc, item) => acc + (Number(item.total_biaya) || 0), 0);
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="py-12 text-center text-gray-400">
          <div class="flex flex-col items-center justify-center space-y-2">
            <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-sm font-medium">Tidak ada data pengeluaran yang cocok</p>
            <p class="text-xs text-gray-400">Coba ganti filter tanggal atau kata kunci pencarian</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((item) => {
    return `
      <tr class="hover:bg-red-50/30 transition">
        <td class="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
          <div>${formatDateDisplay(item.tanggal)}</div>
          ${item.jam ? `<span class="text-xs text-gray-400">${item.jam}</span>` : ''}
        </td>
        <td class="py-3 px-4 text-xs font-mono text-gray-500">
          ${item.id || '-'}
        </td>
        <td class="py-3 px-4 font-bold text-gray-800">
          ${item.nama_barang || '-'}
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass(item.kategori)}">
            ${item.kategori || 'Umum'}
          </span>
        </td>
        <td class="py-3 px-4 text-center text-gray-700 whitespace-nowrap">
          <span class="font-semibold">${item.qty || 0}</span> <span class="text-xs text-gray-500">${item.satuan || ''}</span>
        </td>
        <td class="py-3 px-4 text-right text-gray-600 whitespace-nowrap">
          ${formatCurrency(item.harga_satuan)}
        </td>
        <td class="py-3 px-4 text-right font-bold text-rose-700 whitespace-nowrap">
          <span class="bg-rose-50 px-2 py-1 rounded-md border border-rose-200/80">
            ${formatCurrency(item.total_biaya)}
          </span>
        </td>
        <td class="py-3 px-4 text-gray-600 max-w-xs truncate text-xs" title="${item.keterangan || '-'}">
          ${item.keterangan || '-'}
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            ${item.created_by || 'staff'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// EVENT LISTENERS & TAB CONTROLS
// ============================================================================

// Handle Period Tabs (Today, Week, Month, Year)
document.querySelectorAll('.period-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.period-tab').forEach(t => {
      t.classList.remove('active', 'bg-green-600', 'text-white', 'shadow');
      t.classList.add('text-gray-600', 'hover:bg-gray-50');
    });
    
    this.classList.add('active', 'bg-green-600', 'text-white', 'shadow');
    this.classList.remove('text-gray-600', 'hover:bg-gray-50');
    
    const period = this.getAttribute('data-period');
    currentPeriod = period;
    
    loadDashboard(period);
  });
});

// Default active period styling
const activeTab = document.querySelector('.period-tab.active');
if (activeTab) {
  activeTab.classList.add('bg-green-600', 'text-white', 'shadow');
}
document.querySelectorAll('.period-tab:not(.active)').forEach(tab => {
  tab.classList.add('text-gray-600', 'hover:bg-gray-50');
});

// Table Switcher Tabs (Pemasukan vs Pengeluaran)
const tabBtnIncome = document.getElementById('tabBtnIncome');
const tabBtnExpense = document.getElementById('tabBtnExpense');
const incomeTableSection = document.getElementById('incomeTableSection');
const expenseTableSection = document.getElementById('expenseTableSection');

if (tabBtnIncome && tabBtnExpense) {
  tabBtnIncome.addEventListener('click', () => {
    currentTableTab = 'income';
    tabBtnIncome.className = 'flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-sm font-bold transition shadow bg-white text-green-700 flex items-center justify-center space-x-2';
    tabBtnExpense.className = 'flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-sm font-semibold transition text-gray-600 hover:text-gray-900 flex items-center justify-center space-x-2';
    
    incomeTableSection.classList.remove('hidden');
    expenseTableSection.classList.add('hidden');
    renderIncomeTable();
  });

  tabBtnExpense.addEventListener('click', () => {
    currentTableTab = 'expense';
    tabBtnExpense.className = 'flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-sm font-bold transition shadow bg-white text-red-600 flex items-center justify-center space-x-2';
    tabBtnIncome.className = 'flex-1 md:flex-initial px-5 py-2.5 rounded-lg text-sm font-semibold transition text-gray-600 hover:text-gray-900 flex items-center justify-center space-x-2';
    
    expenseTableSection.classList.remove('hidden');
    incomeTableSection.classList.add('hidden');
    renderExpenseTable();
  });
}

// Date Filter Controls
const filterStartInput = document.getElementById('filterStartDate');
const filterEndInput = document.getElementById('filterEndDate');
const filterSearchInput = document.getElementById('filterSearch');
const btnApplyFilter = document.getElementById('btnApplyDateFilter');
const btnResetFilter = document.getElementById('btnResetDateFilter');

if (btnApplyFilter) {
  btnApplyFilter.addEventListener('click', () => {
    filterStartDate = filterStartInput.value || null;
    filterEndDate = filterEndInput.value || null;
    searchQuery = filterSearchInput.value.trim();
    renderTables();
  });
}

if (btnResetFilter) {
  btnResetFilter.addEventListener('click', () => {
    filterStartInput.value = '';
    filterEndInput.value = '';
    filterSearchInput.value = '';
    filterStartDate = null;
    filterEndDate = null;
    searchQuery = '';
    renderTables();
  });
}

if (filterSearchInput) {
  filterSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderTables();
  });
}

// Quick Date Range Buttons
document.querySelectorAll('.quick-date-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const range = this.getAttribute('data-range');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (range === 'today') {
      filterStartInput.value = todayStr;
      filterEndInput.value = todayStr;
    } else if (range === 'week') {
      const past7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      filterStartInput.value = past7.toISOString().split('T')[0];
      filterEndInput.value = todayStr;
    } else if (range === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filterStartInput.value = firstDay.toISOString().split('T')[0];
      filterEndInput.value = lastDay.toISOString().split('T')[0];
    } else if (range === 'all') {
      filterStartInput.value = '';
      filterEndInput.value = '';
    }

    filterStartDate = filterStartInput.value || null;
    filterEndDate = filterEndInput.value || null;
    renderTables();
  });
});

// ============================================================================
// INITIALIZATION & AUTO-REFRESH (5 SECONDS)
// ============================================================================

// Initial load
loadDashboard(currentPeriod);

// Clear any existing interval
if (refreshInterval) {
  clearInterval(refreshInterval);
}

// Auto-refresh every 5 seconds (as requested)
refreshInterval = setInterval(() => {
  loadDashboard(currentPeriod);
}, 5000);

// Clear interval when page is hidden/closed, resume when active
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
      loadDashboard(currentPeriod);
    }, 5000);
    // Refresh immediately when returning to tab
    loadDashboard(currentPeriod);
  }
});
