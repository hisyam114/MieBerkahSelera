# Panduan Pengguna - Mie Ayam Financial Recording

## 📱 Tentang Aplikasi

Aplikasi Pencatatan Keuangan Mie Ayam adalah sistem berbasis web untuk mencatat pemasukan dan pengeluaran harian bisnis. Aplikasi ini dapat diakses melalui browser di smartphone, tablet, atau komputer.

---

## 🔐 Login / Masuk

### Cara Login:
1. Buka aplikasi di browser (URL akan diberikan setelah deployment)
2. Masukkan **Username** Anda
3. Masukkan **PIN** 6 digit
4. Klik tombol **"Masuk"**

### Default Login:
- **Admin/Owner:**
  - Username: `admin`
  - PIN: `123456`

- **Kasir/Staff:**
  - Username: `kasir1`
  - PIN: `111111`

⚠️ **Penting:** Ganti PIN default setelah penggunaan pertama!

---

## 💰 Cara Mencatat Pemasukan Harian

### Langkah-langkah:
1. Login ke aplikasi
2. Pilih menu **"Catat Pemasukan"**
3. Isi form dengan data berikut:
   - **Tanggal:** Pilih tanggal pemasukan (default hari ini)
   - **Total Cash:** Masukkan jumlah uang tunai di kasir
   - **Total QRIS:** Masukkan jumlah pembayaran digital (QRIS)
   - **Keterangan (opsional):** Tambahkan catatan jika perlu

4. Perhatikan **Total Pemasukan** yang otomatis dihitung
5. Klik tombol **"Simpan Pemasukan"**
6. Tunggu konfirmasi berhasil

### Contoh Pengisian:
```
Tanggal: 21 Oktober 2026
Total Cash: Rp 850.000
Total QRIS: Rp 420.000
Total Pemasukan: Rp 1.270.000 (otomatis)
Keterangan: Shift sore, ramai pelanggan
```

### Tips:
- ✅ Catat pemasukan setiap kali tutup kasir
- ✅ Minimal salah satu harus diisi (Cash atau QRIS)
- ✅ Data langsung tersimpan ke Google Sheets
- ✅ Form akan reset otomatis setelah berhasil simpan

---

## 🛒 Cara Mencatat Pengeluaran

### Langkah-langkah:
1. Login ke aplikasi
2. Pilih menu **"Catat Pengeluaran"**
3. Isi form dengan data berikut:
   - **Tanggal:** Pilih tanggal pembelian (default hari ini)
   - **Jam:** Waktu pembelian (default sekarang)
   - **Nama Barang:** Pilih dari dropdown list
   - **Kategori:** Otomatis terisi setelah pilih barang
   - **Satuan:** Otomatis terisi setelah pilih barang
   - **Jumlah:** Masukkan qty yang dibeli
   - **Harga Satuan:** Masukkan harga per unit
   - **Keterangan (opsional):** Tambahkan catatan lokasi/toko

4. Perhatikan **Total Biaya** yang otomatis dihitung
5. Klik tombol **"Simpan Pengeluaran"**
6. Tunggu konfirmasi berhasil

### Contoh Pengisian:
```
Tanggal: 21 Oktober 2026
Jam: 08:30
Nama Barang: AYAM CINCANG
Kategori: Bahan Baku (otomatis)
Satuan: kg (otomatis)
Jumlah: 5
Harga Satuan: Rp 45.000
Total Biaya: Rp 225.000 (otomatis)
Keterangan: Beli di Pasar Baru
```

### Tips:
- ✅ Catat pengeluaran sesegera mungkin setelah belanja
- ✅ Pilih barang dari dropdown untuk konsistensi data
- ✅ Gunakan keterangan untuk mencatat lokasi/toko pembelian
- ✅ Form tetap di tanggal/jam yang sama setelah simpan untuk input cepat

---

## 📊 Cara Melihat Dashboard (Khusus Admin)

### Akses Dashboard:
1. Login dengan akun **Admin**
2. Akan langsung masuk ke halaman Dashboard
3. Atau klik menu **"Dashboard"** dari halaman lain

### Fitur Dashboard:
Dashboard menampilkan 3 kartu KPI utama:
- 💚 **Total Pemasukan:** Jumlah seluruh pemasukan
- 🔴 **Total Pengeluaran:** Jumlah seluruh pengeluaran
- 💙 **Laba Bersih:** Pemasukan - Pengeluaran

### Periode Waktu:
Klik tab periode untuk melihat data berbeda:
- **Hari Ini:** Data hari ini saja
- **7 Hari Terakhir:** Data 1 minggu terakhir
- **Bulan Ini:** Data bulan berjalan
- **Tahun Ini:** Data tahun berjalan

### Tips:
- 📊 Data diperbarui otomatis setiap 30 detik
- 📊 Klik refresh browser untuk update manual
- 📊 Angka negatif pada Laba Bersih = Rugi

---

## 👤 Perbedaan Hak Akses

### Staff/Kasir:
- ✅ Login
- ✅ Catat Pemasukan
- ✅ Catat Pengeluaran
- ❌ Tidak bisa lihat Dashboard

### Admin/Owner:
- ✅ Login
- ✅ Catat Pemasukan
- ✅ Catat Pengeluaran
- ✅ Lihat Dashboard (semua periode)
- ✅ Kelola data di Google Sheets

---

## 🔧 Tips Umum

### Untuk Kelancaran Penggunaan:
1. **Koneksi Internet:**
   - Pastikan ada koneksi internet stabil
   - Aplikasi memerlukan internet untuk sinkronisasi data

2. **Browser yang Disarankan:**
   - Google Chrome (terbaru)
   - Safari (untuk iPhone/iPad)
   - Firefox (terbaru)
   - Microsoft Edge (terbaru)

3. **Keamanan:**
   - Jangan share username dan PIN ke orang lain
   - Logout setelah selesai menggunakan
   - Ganti PIN default saat pertama kali login

4. **Backup Data:**
   - Data tersimpan aman di Google Sheets
   - Owner dapat download backup dari Google Sheets

---

## ❓ Troubleshooting / Mengatasi Masalah

### "Login gagal"
- ✅ Periksa username dan PIN (6 digit)
- ✅ Pastikan koneksi internet aktif
- ✅ Hubungi admin untuk reset PIN

### "Gagal menyimpan data"
- ✅ Periksa koneksi internet
- ✅ Pastikan semua field required (*) sudah diisi
- ✅ Refresh halaman dan coba lagi

### "Dropdown barang tidak muncul"
- ✅ Tunggu beberapa detik (loading dari server)
- ✅ Periksa koneksi internet
- ✅ Refresh halaman browser

### "Dashboard tidak menampilkan data"
- ✅ Pastikan login sebagai Admin
- ✅ Periksa koneksi internet
- ✅ Pastikan sudah ada data di Google Sheets

### Data tidak sesuai
- ✅ Tunggu 30 detik untuk auto-refresh
- ✅ Klik refresh browser manual
- ✅ Periksa langsung di Google Sheets

---

## 📞 Kontak Support

Jika mengalami masalah yang tidak dapat diatasi:
1. Screenshot halaman error
2. Catat pesan error yang muncul
3. Hubungi admin/owner sistem

---

## 📝 Changelog

### Version 1.0.0 (Oktober 2026)
- ✅ Fitur login dengan PIN
- ✅ Catat pemasukan harian (Cash + QRIS)
- ✅ Catat pengeluaran operasional
- ✅ Dashboard real-time untuk Admin
- ✅ Responsive design untuk semua device
- ✅ Integrasi dengan Google Sheets

---

**Terima kasih telah menggunakan Aplikasi Pencatatan Keuangan Mie Ayam!** 🍜
