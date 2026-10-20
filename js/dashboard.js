/**
 * Dashboard Page Logic
 * Handles period switching and KPI display
 */

// Check admin access
Auth.requireAdmin();

// Display user name
const user = Auth.getCurrentUser();
if (user) {
  document.getElementById('userName').textContent = user.nama_lengkap;
}

// Current selected period
let currentPeriod = 'today';

// Auto-refresh interval reference
let refreshInterval = null;

// Load dashboard data with cache busting
async function loadDashboard(period = 'today', showLoading = true) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const incomeValue = document.getElementById('incomeValue');
  const expenseValue = document.getElementById('expenseValue');
  const profitValue = document.getElementById('profitValue');
  
  try {
    // Show loading only on initial load or manual refresh
    if (showLoading) {
      loadingOverlay.classList.remove('hidden');
    }
    
    // Fetch data from API with cache busting
    const data = await API.getDashboard(period);
    
    // Format currency
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(value);
    };
    
    // Update KPI values
    incomeValue.textContent = formatCurrency(data.income);
    expenseValue.textContent = formatCurrency(data.expense);
    profitValue.textContent = formatCurrency(data.profit);
    
    // Update profit card styling based on value
    const profitCard = profitValue.closest('.border-l-4');
    if (data.profit >= 0) {
      profitCard.classList.remove('border-red-500');
      profitCard.classList.add('border-blue-500');
      profitValue.classList.remove('text-red-600');
      profitValue.classList.add('text-gray-800');
    } else {
      profitCard.classList.remove('border-blue-500');
      profitCard.classList.add('border-red-500');
      profitValue.classList.remove('text-gray-800');
      profitValue.classList.add('text-red-600');
    }
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    alert('Gagal memuat data dashboard: ' + error.message);
  } finally {
    // Hide loading
    loadingOverlay.classList.add('hidden');
  }
}

// Handle period tab clicks
document.querySelectorAll('.period-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    // Update active tab styling
    document.querySelectorAll('.period-tab').forEach(t => {
      t.classList.remove('active', 'bg-green-600', 'text-white');
      t.classList.add('text-gray-600', 'hover:bg-gray-50');
    });
    
    this.classList.add('active', 'bg-green-600', 'text-white');
    this.classList.remove('text-gray-600', 'hover:bg-gray-50');
    
    // Get selected period
    const period = this.getAttribute('data-period');
    currentPeriod = period;
    
    // Load data for selected period
    loadDashboard(period);
  });
});

// Add active styling to default tab
document.querySelector('.period-tab.active').classList.add('bg-green-600', 'text-white');
document.querySelectorAll('.period-tab:not(.active)').forEach(tab => {
  tab.classList.add('text-gray-600', 'hover:bg-gray-50');
});

// Initial load with loading overlay
loadDashboard(currentPeriod, true);

// Clear any existing interval
if (refreshInterval) {
  clearInterval(refreshInterval);
}

// Auto-refresh every 10 seconds (without loading overlay)
refreshInterval = setInterval(() => {
  loadDashboard(currentPeriod, false);
}, 10000);

// Clear interval when page is hidden/closed
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  } else {
    // Resume auto-refresh when page becomes visible again
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(() => {
      loadDashboard(currentPeriod, false);
    }, 10000);
    // Refresh immediately when returning
    loadDashboard(currentPeriod, false);
  }
});
