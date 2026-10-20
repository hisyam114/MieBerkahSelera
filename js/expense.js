/**
 * Expense Form Page Logic
 * Handles operational expense recording
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
    <a href="income.html" class="px-6 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
      Pemasukan
    </a>
    <a href="expense.html" class="px-6 py-3 rounded-lg text-sm font-medium bg-red-500 text-white shadow-md">
      Pengeluaran
    </a>
  `;
} else {
  navigationTabs.innerHTML = `
    <a href="income.html" class="px-6 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
      Pemasukan
    </a>
    <a href="expense.html" class="px-6 py-3 rounded-lg text-sm font-medium bg-red-500 text-white shadow-md">
      Pengeluaran
    </a>
  `;
}

// Set default date and time
const today = new Date().toISOString().split('T')[0];
const now = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
document.getElementById('tanggal').value = today;
document.getElementById('jam').value = now;

// Store master items data
let masterItems = [];

// Load master items dropdown
async function loadMasterItems() {
  const dropdown = document.getElementById('nama_barang');
  const infoText = dropdown.nextElementSibling;
  
  try {
    masterItems = await API.getMasterItems();
    
    // Clear loading message
    dropdown.innerHTML = '<option value="">-- Pilih Barang --</option>';
    
    // Populate dropdown
    masterItems.forEach(item => {
      const option = document.createElement('option');
      option.value = item.nama_barang;
      option.textContent = item.nama_barang;
      option.dataset.kategori = item.kategori;
      option.dataset.satuan = item.satuan;
      dropdown.appendChild(option);
    });
    
    infoText.textContent = `${masterItems.length} barang tersedia`;
    infoText.classList.remove('text-gray-500');
    infoText.classList.add('text-green-600');
    
  } catch (error) {
    console.error('Error loading master items:', error);
    infoText.textContent = 'Gagal memuat daftar barang';
    infoText.classList.remove('text-gray-500');
    infoText.classList.add('text-red-600');
  }
}

// Handle item selection - auto-fill category and unit
document.getElementById('nama_barang').addEventListener('change', function() {
  const selectedOption = this.options[this.selectedIndex];
  
  if (selectedOption.value) {
    document.getElementById('kategori').value = selectedOption.dataset.kategori || '';
    document.getElementById('satuan').value = selectedOption.dataset.satuan || '';
  } else {
    document.getElementById('kategori').value = '';
    document.getElementById('satuan').value = '';
  }
  
  updateTotal();
});

// Auto-calculate total biaya
const qtyInput = document.getElementById('qty');
const hargaSatuanInput = document.getElementById('harga_satuan');
const totalBiayaDisplay = document.getElementById('totalBiaya');

function updateTotal() {
  const qty = parseFloat(qtyInput.value) || 0;
  const hargaSatuan = parseFloat(hargaSatuanInput.value) || 0;
  const total = qty * hargaSatuan;
  
  totalBiayaDisplay.textContent = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(total);
}

qtyInput.addEventListener('input', updateTotal);
hargaSatuanInput.addEventListener('input', updateTotal);

// Handle form submission
document.getElementById('expenseForm').addEventListener('submit', async (e) => {
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
    jam: document.getElementById('jam').value,
    nama_barang: document.getElementById('nama_barang').value,
    kategori: document.getElementById('kategori').value,
    qty: parseFloat(document.getElementById('qty').value) || 0,
    satuan: document.getElementById('satuan').value,
    harga_satuan: parseFloat(document.getElementById('harga_satuan').value) || 0,
    keterangan: document.getElementById('keterangan').value.trim(),
    created_by: user.username
  };
  
  // Validation
  if (!formData.nama_barang) {
    errorText.textContent = 'Pilih nama barang terlebih dahulu';
    errorMessage.classList.remove('hidden');
    return;
  }
  
  if (formData.qty <= 0) {
    errorText.textContent = 'Jumlah harus lebih dari 0';
    errorMessage.classList.remove('hidden');
    return;
  }
  
  if (formData.harga_satuan <= 0) {
    errorText.textContent = 'Harga satuan harus lebih dari 0';
    errorMessage.classList.remove('hidden');
    return;
  }
  
  // Show loading
  loadingOverlay.classList.remove('hidden');
  submitButton.disabled = true;
  
  try {
    // Submit to API
    const result = await API.submitExpense(formData);
    
    // Show success message
    const totalFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(result.total_biaya);
    
    successText.textContent = `Pengeluaran berhasil dicatat! Total: ${totalFormatted}`;
    successMessage.classList.remove('hidden');
    
    // Reset form but keep date/time
    const currentDate = document.getElementById('tanggal').value;
    const currentTime = document.getElementById('jam').value;
    
    form.reset();
    
    document.getElementById('tanggal').value = currentDate;
    document.getElementById('jam').value = currentTime;
    document.getElementById('kategori').value = '';
    document.getElementById('satuan').value = '';
    updateTotal();
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      successMessage.classList.add('hidden');
    }, 5000);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Error submitting expense:', error);
    errorText.textContent = error.message || 'Gagal menyimpan data. Silakan coba lagi.';
    errorMessage.classList.remove('hidden');
    
  } finally {
    // Hide loading
    loadingOverlay.classList.add('hidden');
    submitButton.disabled = false;
  }
});

// Initialize: Load master items
loadMasterItems();

// Focus on item dropdown after data loads
setTimeout(() => {
  document.getElementById('nama_barang').focus();
}, 1000);
