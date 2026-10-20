/**
 * Income Form Page Logic
 * Handles daily income recording
 */

// Require authentication
Auth.requireAuth();

// Display user name
const user = Auth.getCurrentUser();
if (user) {
  document.getElementById('userName').textContent = user.nama_lengkap;
}

// Setup navigation tabs based on role
const navigationTabs = document.getElementById('navigationTabs');
if (Auth.isAdmin()) {
  navigationTabs.innerHTML = `
    <a href="dashboard.html" class="px-6 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
      Dashboard
    </a>
    <a href="income.html" class="px-6 py-3 rounded-lg text-sm font-medium bg-green-600 text-white shadow-md">
      Pemasukan
    </a>
    <a href="expense.html" class="px-6 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
      Pengeluaran
    </a>
  `;
} else {
  navigationTabs.innerHTML = `
    <a href="income.html" class="px-6 py-3 rounded-lg text-sm font-medium bg-green-600 text-white shadow-md">
      Pemasukan
    </a>
    <a href="expense.html" class="px-6 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
      Pengeluaran
    </a>
  `;
}

// Helper to get local date in YYYY-MM-DD format (avoids UTC timezone shift)
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Set default date to today
const today = getLocalDateString();
document.getElementById('tanggal').value = today;

// Auto-calculate total pemasukan
const totalCashInput = document.getElementById('total_cash');
const totalQrisInput = document.getElementById('total_qris');
const totalPemasukanDisplay = document.getElementById('totalPemasukan');

function updateTotal() {
  const cash = parseFloat(totalCashInput.value) || 0;
  const qris = parseFloat(totalQrisInput.value) || 0;
  const total = cash + qris;
  
  totalPemasukanDisplay.textContent = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(total);
}

totalCashInput.addEventListener('input', updateTotal);
totalQrisInput.addEventListener('input', updateTotal);

// Handle form submission
document.getElementById('incomeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  const submitButton = document.getElementById('submitButton');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const successMessage = document.getElementById('successMessage');
  const successText = document.getElementById('successText');
  const errorMessage = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  
  // Hide previous messages
  successMessage.classList.add('hidden');
  errorMessage.classList.add('hidden');
  
  // Get form data
  const formData = {
    tanggal: document.getElementById('tanggal').value,
    total_cash: parseFloat(document.getElementById('total_cash').value) || 0,
    total_qris: parseFloat(document.getElementById('total_qris').value) || 0,
    keterangan: document.getElementById('keterangan').value.trim(),
    created_by: user.username
  };
  
  // Validation
  if (formData.total_cash < 0 || formData.total_qris < 0) {
    errorText.textContent = 'Jumlah tidak boleh negatif';
    errorMessage.classList.remove('hidden');
    return;
  }
  
  if (formData.total_cash === 0 && formData.total_qris === 0) {
    errorText.textContent = 'Minimal salah satu harus diisi (Cash atau QRIS)';
    errorMessage.classList.remove('hidden');
    return;
  }
  
  // Show loading
  loadingOverlay.classList.remove('hidden');
  submitButton.disabled = true;
  
  try {
    // Submit to API
    const result = await API.submitIncome(formData);
    
    // Show success message
    const totalFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(result.total_pemasukan);
    
    successText.textContent = `Pemasukan berhasil dicatat! Total: ${totalFormatted}`;
    successMessage.classList.remove('hidden');
    
    // Reset form
    form.reset();
    document.getElementById('tanggal').value = today; // Reset to today
    updateTotal();
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      successMessage.classList.add('hidden');
    }, 5000);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Error submitting income:', error);
    errorText.textContent = error.message || 'Gagal menyimpan data. Silakan coba lagi.';
    errorMessage.classList.remove('hidden');
    
  } finally {
    // Hide loading
    loadingOverlay.classList.add('hidden');
    submitButton.disabled = false;
  }
});

// Focus on first input field
document.getElementById('total_cash').focus();
