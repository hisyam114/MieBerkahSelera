# Product Requirements Document (PRD)

## Financial Recording Web Application for Mie Ayam Business

---

## 1. Executive Summary

The **Mie Ayam Financial Recording Web Application** is a lightweight, responsive, and cost-effective financial management tool tailored specifically for a chicken noodle (*Mie Ayam*) food enterprise. The app streamlines daily revenue logging (Cash & QRIS) and detailed operational expense tracking (raw materials, seasonings, packaging, and utilities).

By leveraging **Google Sheets** as a database, **Google Apps Script (GAS)** as a backend REST API, and **GitHub Pages** for static frontend hosting, the entire application operates at zero server infrastructure cost while delivering high reliability and cross-device accessibility.

**Google Sheets** Link: https://docs.google.com/spreadsheets/d/13RxW3a6eqGzNFSExhcXbb8l0p1waoqCGUW7dkhB2fRs/edit?usp=sharing

---

## 2. Goals & Objectives

* **Speed & Simplicity:** Enable staff and owners to log daily sales recaps and individual purchase receipts within seconds using mobile devices.
* **Real-time Financial Insights:** Provide clear, automated financial summaries (Income, Expenses, Net Profit) categorized across daily, weekly (past 7 days), monthly, and annual timeframes.
* **Role-Based Access Control:** Protect sensitive financial reports by separating privileges between **Staff** (input-only access) and **Admin/Owner** (full input and report dashboard access).
* **Cross-Device Responsiveness:** Ensure an optimized user interface for smartphones, tablets, and desktop computers without requiring native app installations.

---

## 3. User Roles & Permissions

| Feature / Module | Staff | Admin (Owner) |
| :--- | :---: | :---: |
| PIN Authentication / Login | Yes | Yes |
| Log Daily Income (`total_cash` & `total_qris`) | Yes | Yes |
| Log Operational Expenses (`nama_barang`, `qty`, `harga_satuan`) | Yes | Yes |
| Fetch Master Item Dropdown List | Yes | Yes |
| View Financial Dashboard (Daily, Weekly, Monthly, Yearly) | No | Yes |
| Add / Edit Master Items List (Directly in Google Sheets) | No | Yes |

---

## 4. System Architecture & Tech Stack

### 4.1 Tech Stack
* **Frontend:** HTML5, CSS3 with Tailwind CSS (via CDN), Vanilla JavaScript (ES6+).
* **Backend API:** Google Apps Script (Deployed as a Web App endpoint serving `doGet` and `doPost`).
* **Database:** Google Sheets (5 dedicated worksheets).
* **Hosting:** GitHub Pages (Static Web Hosting).

### 4.2 System Data Flow Diagram

```
[ User Device (Mobile / Desktop Browser) ]
                    │
                    ▼
[ GitHub Pages Frontend (HTML / Tailwind CSS / JS) ]
                    │
        ┌───────────┴───────────┐
        │ HTTP POST (Write)     │ HTTP GET (Read)
        ▼                       ▼
[ Google Apps Script Endpoint (doPost / doGet) ]
                    │
                    ▼
[ Google Sheets Database File ]
 ├── Pemasukan_Harian
 ├── Pengeluaran
 ├── Master_Barang
 ├── Users
 └── Dashboard
```

---

## 5. Feature Specifications & Functionality

### 5.1 Authentication Module (Login)
* **Inputs:** Username / User selection + 6-digit PIN.
* **Validation:** Matches credentials against the `Users` worksheet.
* **Session Management:** Stores session tokens in `sessionStorage` (cleared upon tab closure or logout).
* **Redirection:** Redirects Staff directly to input forms; redirects Admin to the Dashboard view with access to input forms.

### 5.2 Daily Income Module
* **Target Users:** Staff & Admin.
* **Form Inputs:**
  * `tanggal`: Defaults to current date (`YYYY-MM-DD`), editable for retroactive logging.
  * `total_cash`: Numeric input for total cash in the register at shift close.
  * `total_qris`: Numeric input for total QRIS digital payments received.
  * `total_pemasukan`: Auto-calculated frontend preview (`total_cash` + `total_qris`).
  * `keterangan`: Optional text note (e.g., "Rainy afternoon shift").
* **Action:** Submitting sends an HTTP POST request to append a new row to `Pemasukan_Harian`.

### 5.3 Expense Module
* **Target Users:** Staff & Admin.
* **Form Inputs:**
  * `tanggal` & `jam`: Auto-populated with current date and time.
  * `nama_barang`: Dynamic dropdown menu loaded from `Master_Barang`.
  * `kategori` & `satuan`: Auto-filled based on the selected item from `Master_Barang`.
  * `qty`: Numeric input (quantity purchased).
  * `harga_satuan`: Numeric input (unit price in IDR).
  * `total_biaya`: Auto-calculated frontend preview (`qty` * `harga_satuan`).
  * `keterangan`: Optional text note (e.g., "Purchased at Pasar Baru market").
* **Action:** Submitting sends an HTTP POST request to append a new row to `Pengeluaran`.

### 5.4 Dashboard & Financial Reporting Module (Admin Only)
* **Time Horizon Filters:** Toggle tabs for **Today**, **This Week (Past 7 Days)**, **This Month**, and **This Year**.
* **Key Performance Indicator (KPI) Cards:**
  1. **Total Income:** Sum of income for the selected timeframe.
  2. **Total Expense:** Sum of operational expenditures for the selected timeframe.
  3. **Net Profit / Loss:** `Total Income - Total Expense`.
* **Summary Table:** Breakdown of top expense items categorized by raw materials, packaging, and utilities.

---

## 6. Database Specifications (Google Sheets Schema)

*Note: All column header names are preserved in Indonesian to align directly with the Google Sheets structure.*

### 6.1 Sheet: `Pemasukan_Harian`

| Column | Field Name | Data Type | Description & Format |
| :---: | :--- | :--- | :--- |
| A | `id_pemasukan` | String | Unique ID, e.g., `INC-20261021` |
| B | `tanggal` | Date | Transaction Date (`YYYY-MM-DD`) |
| C | `total_cash` | Number | Total cash revenue in IDR |
| D | `total_qris` | Number | Total QRIS revenue in IDR |
| E | `total_pemasukan` | Formula / Number | Formula: `=C2+D2` |
| F | `keterangan` | String | Operational notes |
| G | `created_by` | String | Username of logger |

### 6.2 Sheet: `Pengeluaran`

| Column | Field Name | Data Type | Description & Format |
| :---: | :--- | :--- | :--- |
| A | `id_transaksi` | String | Unique ID, e.g., `EXP-20261021-001` |
| B | `tanggal` | Date | Purchase Date (`YYYY-MM-DD`) |
| C | `jam` | Time | Timestamp (`HH:mm:ss`) |
| D | `nama_barang` | String | Item name selected from `Master_Barang` |
| E | `kategori` | String | Auto-filled category (Bahan Baku, Bumbu, etc.) |
| F | `qty` | Number | Quantity purchased |
| G | `satuan` | String | Unit of measurement (`kg`, `pack`, `botol`, etc.) |
| H | `harga_satuan` | Number | Price per unit in IDR |
| I | `total_biaya` | Formula / Number | Formula: `=F2*H2` |
| J | `keterangan` | String | Vendor / location notes |
| K | `created_by` | String | Username of logger |

### 6.3 Sheet: `Master_Barang`

| Column | Field Name | Data Type | Example Values |
| :---: | :--- | :--- | :--- |
| A | `id_barang` | String | `BRG-001` |
| B | `nama_barang` | String | AYAM CINCANG, SAOS, SASA KECIL, GAS, BAWANG PUTIH, etc. |
| C | `kategori` | String | Bahan Baku, Bumbu, Kemasan, Operasional, Kebersihan |
| D | `satuan` | String | kg, botol, pcs, bungkus, pack, tabung, ikat, pouch |

### 6.4 Sheet: `Users`

| Column | Field Name | Data Type | Example Values |
| :---: | :--- | :--- | :--- |
| A | `username` | String | `admin`, `kasir1` |
| B | `pin` | String | 6-digit PIN code (`123456`) |
| C | `nama_lengkap` | String | `Owner Mie Ayam`, `Staff Kasir` |
| D | `role` | String | `Admin`, `Staff` |
| E | `status` | String | `Aktif`, `Nonaktif` |

### 6.5 Sheet: `Dashboard` (Automated Formulas)

| KPI Metric | Target Cell | Google Sheets Formula |
| :--- | :---: | :--- |
| **Income Today** | B2 | `=SUMIFS(Pemasukan_Harian!E:E, Pemasukan_Harian!B:B, TODAY())` |
| **Expense Today** | B3 | `=SUMIFS(Pengeluaran!I:I, Pengeluaran!B:B, TODAY())` |
| **Net Profit Today** | B4 | `=B2-B3` |
| **Income This Week** | B7 | `=SUMIFS(Pemasukan_Harian!E:E, Pemasukan_Harian!B:B, ">="&(TODAY()-6), Pemasukan_Harian!B:B, "<="&TODAY())` |
| **Expense This Week** | B8 | `=SUMIFS(Pengeluaran!I:I, Pengeluaran!B:B, ">="&(TODAY()-6), Pengeluaran!B:B, "<="&TODAY())` |
| **Net Profit This Week** | B9 | `=B7-B8` |
| **Income This Month** | B12 | `=SUMIFS(Pemasukan_Harian!E:E, Pemasukan_Harian!B:B, ">="&DATE(YEAR(TODAY()), MONTH(TODAY()), 1), Pemasukan_Harian!B:B, "<="&EOMONTH(TODAY(),0))` |
| **Expense This Month** | B13 | `=SUMIFS(Pengeluaran!I:I, Pengeluaran!B:B, ">="&DATE(YEAR(TODAY()), MONTH(TODAY()), 1), Pengeluaran!B:B, "<="&EOMONTH(TODAY(),0))` |
| **Net Profit This Month** | B14 | `=B12-B13` |
| **Income This Year** | B17 | `=SUMIFS(Pemasukan_Harian!E:E, Pemasukan_Harian!B:B, ">="&DATE(YEAR(TODAY()), 1, 1), Pemasukan_Harian!B:B, "<="&DATE(YEAR(TODAY()), 12, 31))` |
| **Expense This Year** | B18 | `=SUMIFS(Pengeluaran!I:I, Pengeluaran!B:B, ">="&DATE(YEAR(TODAY()), 1, 1), Pengeluaran!B:B, "<="&DATE(YEAR(TODAY()), 12, 31))` |
| **Net Profit This Year** | B19 | `=B17-B18` |

---

## 7. UI/UX Requirements

* **Mobile-First Touch Architecture:** Minimum touch target size of 48x48px for form fields and submit buttons to accommodate quick entry on smartphones.
* **Visual Hierarchy & Color Coding:**
  * Green accents (`#10B981`) for Income actions and positive balances.
  * Amber/Red accents (`#EF4444`) for Expense logging and negative balances.
* **Feedback Mechanism:** Modal popups or toast notifications confirming successful data transmission or displaying clear error messages on network failure.
* **Automatic Form Reset:** Input fields reset automatically after successful submission to prevent accidental duplicate entries.

---

## 8. Non-Functional & Security Requirements

* **Zero-Cost Deployment:** 100% free hosting and database runtime using GitHub Pages and Google Cloud infrastructure limits.
* **Performance:** Initial page load under 2.0 seconds on standard 4G mobile networks.
* **Data Integrity:** Primary keys (`id_pemasukan` and `id_transaksi`) generated automatically to prevent duplicate processing.
* **Maintenance:** Adding new inventory items requires zero code modification; items added directly to `Master_Barang` appear automatically in the web dropdown menu.