# Panduan Administrator - Mie Ayam Financial Recording

## 🎯 Untuk Administrator/Owner

Dokumen ini berisi panduan lengkap untuk mengelola sistem, menambah user, mengelola master data, dan troubleshooting tingkat lanjut.

---

## 📋 Daftar Isi
1. [Deployment Setup](#deployment-setup)
2. [Mengelola Users](#mengelola-users)
3. [Mengelola Master Barang](#mengelola-master-barang)
4. [Backup & Recovery](#backup--recovery)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Security Best Practices](#security-best-practices)
7. [Advanced Troubleshooting](#advanced-troubleshooting)

---

## 🚀 Deployment Setup

### 1. Google Apps Script Deployment

Sudah selesai jika Anda mengikuti IMPLEMENTATION_PLAN.md. Berikut ringkasannya:

**Langkah singkat:**
1. Buka Google Sheets
2. Extensions → Apps Script
3. Copy-paste code dari `backend/Code.gs`
4. Deploy → New deployment → Web app
5. Copy Web App URL ke `js/config.js`

**Web App URL Format:**
```
https://script.google.com/macros/s/AKfycby.../exec
```

### 2. GitHub Pages Deployment

**Langkah singkat:**
1. Push semua file ke GitHub repository
2. Settings → Pages
3. Source: main branch, root folder
4. Site akan available di:
   ```
   https://YOUR_USERNAME.github.io/REPO_NAME/
   ```

### 3. Custom Domain (Opsional)

Jika ingin menggunakan domain sendiri (contoh: `keuangan.mieayam.com`):
1. Beli domain di provider (Niagahoster, Rumahweb, dll)
2. Di GitHub Pages settings, tambahkan custom domain
3. Tambahkan CNAME record di DNS provider:
   ```
   CNAME: keuangan → YOUR_USERNAME.github.io
   ```

---

## 👥 Mengelola Users

### Menambah User Baru

1. **Buka Google Sheets**
   - URL: https://docs.google.com/spreadsheets/d/13RxW3a6eqGzNFSExhcXbb8l0p1waoqCGUW7dkhB2fRs/edit

2. **Buka Sheet "Users"**

3. **Tambahkan row baru dengan format:**
   ```
   username | pin | nama_lengkap | role | status
   ```

4. **Contoh:**
   ```
   kasir2 | 222222 | Staff Kasir 2 | Staff | Aktif
   manager | 999999 | Manager Operasional | Admin | Aktif
   ```

### Role Types:
- **Admin:** Akses penuh (Dashboard + Input)
- **Staff:** Hanya Input (tidak bisa Dashboard)

### Status Types:
- **Aktif:** User dapat login
- **Nonaktif:** User tidak dapat login

### Mengganti PIN User

1. Buka Sheet "Users"
2. Cari row user yang ingin diganti PIN
3. Edit kolom B (pin) dengan 6 digit angka baru
4. User dapat login dengan PIN baru segera

### Menonaktifkan User

1. Buka Sheet "Users"
2. Cari row user yang ingin dinonaktifkan
3. Ubah kolom E (status) dari "Aktif" menjadi "Nonaktif"
4. User tidak dapat login lagi

### Menghapus User

⚠️ **Hati-hati!** Menghapus user tidak dapat di-undo.

1. Buka Sheet "Users"
2. Klik kanan pada nomor row
3. Pilih "Delete row"
4. User segera terhapus dari sistem

---

## 📦 Mengelola Master Barang

### Menambah Barang Baru

1. **Buka Google Sheets**
2. **Buka Sheet "Master_Barang"**
3. **Tambahkan row baru dengan format:**
   ```
   id_barang | nama_barang | kategori | satuan
   ```

4. **Contoh:**
   ```
   BRG-009 | KECAP MANIS | Bumbu | botol
   BRG-010 | PLASTIK KEMASAN | Kemasan | pack
   ```

### ID Barang Format:
- Format: `BRG-XXX`
- XXX = nomor urut (001, 002, 003, dst)
- Pastikan tidak ada duplikat ID

### Kategori yang Tersedia:
- **Bahan Baku:** Bahan utama (ayam, mie, sayur)
- **Bumbu:** Saos, kecap, sasa, dll
- **Kemasan:** Box, plastik, sendok, dll
- **Operasional:** Gas, listrik, air
- **Kebersihan:** Sabun, pel, tissue

### Satuan yang Umum:
- `kg` - Kilogram
- `botol` - Botol
- `pack` - Pack/Bungkus
- `pcs` - Pieces/Item
- `tabung` - Tabung gas
- `ikat` - Ikat
- `pouch` - Pouch/Sachet
- `liter` - Liter

### Mengedit Nama Barang

1. Buka Sheet "Master_Barang"
2. Cari row barang yang ingin diedit
3. Edit kolom B (nama_barang)
4. ⚠️ **Catatan:** Perubahan nama tidak mengubah data historis

### Menghapus Barang

⚠️ **Rekomendasi:** Jangan hapus barang yang sudah pernah dipakai!

**Alternatif:** Tambahkan "[DISCONTINUED]" di depan nama barang:
```
Sebelum: AYAM CINCANG
Sesudah: [DISCONTINUED] AYAM CINCANG
```

---

## 💾 Backup & Recovery

### Backup Otomatis Google Sheets

Google Sheets sudah otomatis menyimpan history perubahan. Untuk restore:

1. Buka Google Sheets
2. File → Version history → See version history
3. Pilih versi yang ingin di-restore
4. Klik "Restore this version"

### Manual Backup (Disarankan Mingguan)

**Export ke Excel:**
1. Buka Google Sheets
2. File → Download → Microsoft Excel (.xlsx)
3. Simpan file dengan nama: `Backup_MieAyam_YYYYMMDD.xlsx`
4. Simpan di folder aman (Google Drive, OneDrive, dll)

**Export ke PDF (Laporan):**
1. Buka Sheet "Dashboard"
2. File → Download → PDF Document
3. Simpan sebagai laporan bulanan

### Recovery dari Backup

Jika data hilang/rusak:
1. Buka file backup Excel
2. Copy data yang perlu di-recover
3. Paste ke Google Sheets di sheet yang sesuai
4. Pastikan format kolom sesuai

---

## 📊 Monitoring & Maintenance

### Daily Checks (Harian)

✅ **Cek apakah:**
- Staff sudah mencatat pemasukan hari ini?
- Pengeluaran sudah tercatat semua?
- Dashboard menampilkan angka yang wajar?

### Weekly Checks (Mingguan)

✅ **Lakukan:**
1. Export backup ke Excel
2. Review pengeluaran terbesar minggu ini
3. Bandingkan dengan minggu lalu
4. Periksa apakah ada data yang aneh/salah

### Monthly Checks (Bulanan)

✅ **Lakukan:**
1. Export laporan bulanan ke PDF
2. Review profit margin (Laba / Pemasukan × 100%)
3. Identifikasi pengeluaran yang bisa dikurangi
4. Update PIN user jika perlu

### Quarterly Maintenance (3 Bulan)

✅ **Lakukan:**
1. Bersihkan data duplikat (jika ada)
2. Review daftar Master Barang
3. Hapus user yang sudah tidak aktif
4. Update dokumentasi jika ada perubahan

---

## 🔒 Security Best Practices

### Keamanan Akun

1. **Ganti PIN Default:**
   ```
   admin: 123456 → [6 digit rahasia]
   kasir1: 111111 → [6 digit rahasia]
   ```

2. **Gunakan PIN yang Kuat:**
   - ❌ Jangan: 111111, 123456, 000000
   - ✅ Gunakan: Kombinasi acak 6 digit
   - ✅ Contoh: 437829, 926184

3. **Jangan Share Credentials:**
   - Setiap staff punya akun sendiri
   - Jangan share username/PIN ke orang lain
   - Nonaktifkan user yang sudah resign

### Keamanan Google Sheets

1. **Set Permission yang Benar:**
   - Owner: Can edit (hanya Anda)
   - Admin: Can edit (jika ada admin lain)
   - Staff: No access (mereka akses via web app)

2. **Enable 2-Factor Authentication:**
   - Aktifkan 2FA di Google Account
   - Tambah layer keamanan ekstra

3. **Review Access Regularly:**
   - File → Share → Manage access
   - Periksa siapa saja yang punya akses
   - Hapus akses yang tidak diperlukan

### Keamanan Data

1. **Backup Regular:**
   - Backup mingguan wajib
   - Simpan di 2 lokasi berbeda
   - Enkripsi file backup jika perlu

2. **Monitor Unusual Activity:**
   - Perhatikan login yang mencurigakan
   - Periksa data yang tiba-tiba berubah
   - Review log di Google Apps Script

---

## 🔧 Advanced Troubleshooting

### Problem: Web App tidak merespon

**Diagnosis:**
1. Buka Apps Script editor
2. View → Execution log
3. Cari error message

**Solusi:**
- Redeploy web app
- Pastikan semua sheet name benar
- Check quota Google Apps Script (limit harian)

### Problem: Data tidak tersimpan

**Diagnosis:**
1. Buka browser console (F12)
2. Lihat error di tab Console
3. Check tab Network untuk HTTP errors

**Solusi:**
- Pastikan API_URL di config.js benar
- Check permission Google Sheets
- Pastikan sheet tidak di-protect

### Problem: Dashboard menampilkan Rp 0

**Diagnosis:**
1. Buka Sheet "Dashboard"
2. Click cell yang menampilkan Rp 0
3. Lihat formula di formula bar

**Solusi:**
- Pastikan formula tidak rusak
- Check apakah sheet name masih sama
- Re-create formula jika perlu

### Problem: Dropdown barang kosong

**Diagnosis:**
1. Buka Sheet "Master_Barang"
2. Pastikan ada data di sheet ini
3. Check format kolom

**Solusi:**
- Tambahkan minimal 1 barang
- Pastikan header row benar
- Refresh halaman web

### Problem: Login selalu gagal

**Diagnosis:**
1. Check Sheet "Users"
2. Pastikan user ada dan status "Aktif"
3. Verify PIN format (6 digit string)

**Solusi:**
- Pastikan kolom B (PIN) berformat Text, bukan Number
- Klik kolom B → Format → Number → Plain text
- Re-enter PIN untuk user tersebut

---

## 📞 Emergency Contacts

### Google Sheets Link:
```
https://docs.google.com/spreadsheets/d/13RxW3a6eqGzNFSExhcXbb8l0p1waoqCGUW7dkhB2fRs/edit
```

### Apps Script Project:
- Akses via Google Sheets → Extensions → Apps Script

### GitHub Repository:
- [URL akan diisi setelah push ke GitHub]

---

## 📈 Performance Optimization

### Tips untuk Performa Optimal:

1. **Jangan Hapus Data Historis:**
   - Google Sheets handle big data dengan baik
   - Archive data lama ke sheet terpisah jika perlu

2. **Limit Jumlah Formula:**
   - Formula di Dashboard sudah optimal
   - Jangan tambah formula kompleks di sheet data

3. **Monitor Google Quotas:**
   - Apps Script execution: 90 min/day (free)
   - URL Fetch calls: 20,000/day (free)
   - Trigger total runtime: 90 min/day (free)

---

## 🆘 When Things Go Really Wrong

### Complete System Reset (Last Resort)

⚠️ **BACKUP DULU SEBELUM RESET!**

1. **Backup semua data:**
   - Download Google Sheets ke Excel
   - Screenshot semua sheet

2. **Delete & Re-create:**
   - Delete Apps Script deployment
   - Re-deploy dengan Web App URL baru
   - Update config.js dengan URL baru

3. **Restore data:**
   - Copy-paste data dari backup
   - Verify formula di Dashboard
   - Test login dan input data

---

## 📚 Additional Resources

### Google Apps Script Documentation:
- https://developers.google.com/apps-script

### GitHub Pages Documentation:
- https://docs.github.com/en/pages

### Tailwind CSS Documentation:
- https://tailwindcss.com/docs

---

**Selamat mengelola sistem! Jika ada pertanyaan lebih lanjut, silakan hubungi developer.** 🚀
