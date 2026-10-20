# 🍜 Mie Ayam Financial Recording System

A lightweight, cost-effective financial management web application designed specifically for small food businesses (Mie Ayam / Chicken Noodle enterprise).

## ✨ Features

- 💰 **Daily Income Logging** - Track cash and QRIS (digital payment) revenue
- 🛒 **Expense Tracking** - Record operational expenses with auto-categorization
- 📊 **Real-time Dashboard** - Financial summaries across multiple time periods
- 👥 **Role-Based Access** - Separate permissions for Admin and Staff
- 📱 **Mobile-First Design** - Fully responsive for smartphones, tablets, and desktops
- 🆓 **Zero Infrastructure Cost** - Powered by Google Sheets, Apps Script, and GitHub Pages

## 🏗️ Architecture

```
Frontend (GitHub Pages)
    ↓
Google Apps Script (REST API)
    ↓
Google Sheets (Database)
```

### Tech Stack
- **Frontend:** HTML5, Tailwind CSS (CDN), Vanilla JavaScript (ES6+)
- **Backend:** Google Apps Script
- **Database:** Google Sheets
- **Hosting:** GitHub Pages (Static)

## 📂 Project Structure

```
MieBerkahSelera/
├── index.html              # Login page
├── dashboard.html          # Admin dashboard
├── income.html            # Daily income form
├── expense.html           # Expense logging form
├── css/
│   └── styles.css         # Custom styles
├── js/
│   ├── config.js          # API configuration
│   ├── api.js             # API communication layer
│   ├── auth.js            # Authentication logic
│   ├── dashboard.js       # Dashboard functionality
│   ├── income.js          # Income form logic
│   └── expense.js         # Expense form logic
├── backend/
│   └── Code.gs            # Google Apps Script code
├── .agents/
│   └── product_requirements_document_prd.md
├── IMPLEMENTATION_PLAN.md # Step-by-step implementation guide
├── USER_MANUAL.md         # End-user documentation
├── ADMIN_GUIDE.md         # Administrator documentation
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Google Account (for Google Sheets & Apps Script)
- GitHub Account (for hosting)
- Modern web browser

### Setup Steps

1. **Google Sheets Setup** (15-20 minutes)
   - Open: https://docs.google.com/spreadsheets/d/13RxW3a6eqGzNFSExhcXbb8l0p1waoqCGUW7dkhB2fRs/edit
   - Create 5 worksheets: Pemasukan_Harian, Pengeluaran, Master_Barang, Users, Dashboard
   - Follow the schema in `IMPLEMENTATION_PLAN.md`

2. **Deploy Google Apps Script** (5-10 minutes)
   - Open Google Sheets → Extensions → Apps Script
   - Copy-paste code from `backend/Code.gs`
   - Deploy → New deployment → Web app
   - Copy the Web App URL

3. **Configure Frontend** (1 minute)
   - Open `js/config.js`
   - Replace `YOUR_DEPLOYED_WEB_APP_URL_HERE` with your Web App URL

4. **Deploy to GitHub Pages** (5-10 minutes)
   - Push code to GitHub repository
   - Enable GitHub Pages in repository Settings
   - Access via: `https://YOUR_USERNAME.github.io/REPO_NAME/`

For detailed instructions, see **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)**

## 📖 Documentation

- **[Implementation Plan](IMPLEMENTATION_PLAN.md)** - Complete setup guide with checklists
- **[User Manual](USER_MANUAL.md)** - End-user guide (Indonesian)
- **[Admin Guide](ADMIN_GUIDE.md)** - Administrator & maintenance guide (Indonesian)
- **[PRD](.agents/product_requirements_document_prd.md)** - Product Requirements Document

## 👥 User Roles

### Staff
- ✅ Login with PIN
- ✅ Log daily income
- ✅ Log expenses
- ❌ Cannot access dashboard

### Admin/Owner
- ✅ All Staff permissions
- ✅ Access financial dashboard
- ✅ View reports (Daily, Weekly, Monthly, Yearly)
- ✅ Manage users and master data in Google Sheets

### Default Credentials
```
Admin:  username: admin  | PIN: 123456
Staff:  username: kasir1 | PIN: 111111
```
⚠️ **Change these immediately after first login!**

## 🗄️ Database Schema

### Google Sheets Structure

**Sheet: Pemasukan_Harian**
| Column | Field | Type | Description |
|--------|-------|------|-------------|
| A | id_pemasukan | String | INC-YYYYMMDD |
| B | tanggal | Date | YYYY-MM-DD |
| C | total_cash | Number | Cash revenue |
| D | total_qris | Number | QRIS revenue |
| E | total_pemasukan | Formula | =C+D |
| F | keterangan | String | Notes |
| G | created_by | String | Username |

**Sheet: Pengeluaran**
| Column | Field | Type | Description |
|--------|-------|------|-------------|
| A | id_transaksi | String | EXP-YYYYMMDD-NNN |
| B | tanggal | Date | YYYY-MM-DD |
| C | jam | Time | HH:mm:ss |
| D | nama_barang | String | Item name |
| E | kategori | String | Category |
| F | qty | Number | Quantity |
| G | satuan | String | Unit (kg, pack, etc) |
| H | harga_satuan | Number | Unit price |
| I | total_biaya | Formula | =F*H |
| J | keterangan | String | Notes |
| K | created_by | String | Username |

For complete schema, see [PRD](.agents/product_requirements_document_prd.md)

## 🔒 Security

- PIN-based authentication (6 digits)
- Session management via sessionStorage
- Role-based access control
- Google Sheets permission management
- No sensitive data in frontend code

**Best Practices:**
- Change default PINs immediately
- Enable 2FA on Google Account
- Regular backups (weekly recommended)
- Monitor unusual activity
- Restrict Google Sheets access

## 🎯 API Endpoints

Base URL: `YOUR_WEB_APP_URL`

### GET Requests
- `?action=login&username=X&pin=Y` - Authenticate user
- `?action=master-items` - Fetch all items
- `?action=dashboard&period=X` - Get dashboard data (today/week/month/year)

### POST Requests
- `?action=income` - Submit income record
- `?action=expense` - Submit expense record

Request body: JSON

Response format:
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

## 📱 Browser Support

- ✅ Chrome (recommended)
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ✅ Edge
- ✅ Mobile browsers (Android/iOS)

## 🐛 Troubleshooting

### Common Issues

**Login fails:**
- Check username and 6-digit PIN
- Verify internet connection
- Check Users sheet in Google Sheets

**Data not saving:**
- Verify API_URL in config.js
- Check Google Sheets permissions
- Check browser console for errors

**Dashboard shows Rp 0:**
- Verify formulas in Dashboard sheet
- Check if data exists in source sheets
- Refresh page or wait 30 seconds

For detailed troubleshooting, see [ADMIN_GUIDE.md](ADMIN_GUIDE.md)

## 🔄 Backup & Recovery

**Automated:**
- Google Sheets auto-saves version history
- File → Version history → Restore

**Manual (Recommended Weekly):**
- File → Download → Microsoft Excel
- Save as: `Backup_MieAyam_YYYYMMDD.xlsx`
- Store in Google Drive or OneDrive

## 🎨 Customization

### Colors
Modify Tailwind classes in HTML files:
- Primary (Income): `green-600`
- Danger (Expense): `red-500`
- Info: `blue-600`

### Logo
Replace logo placeholder in `assets/logo.png` (optional)

### Currency Format
Currently: Indonesian Rupiah (IDR)  
To change: Edit `new Intl.NumberFormat()` in JS files

## 📊 Performance

- Initial load: < 2 seconds (on 4G)
- API response: < 1 second (typical)
- Dashboard auto-refresh: 30 seconds
- Mobile-optimized: 48x48px touch targets

## 🤝 Contributing

This is a custom business application. For feature requests or bug reports, contact the system administrator.

## 📄 License

Proprietary - For internal business use only.

## 🙏 Acknowledgments

- Built with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Google Apps Script](https://developers.google.com/apps-script)
- Hosted on [GitHub Pages](https://pages.github.com/)

## 📞 Support

For technical support:
- Check [USER_MANUAL.md](USER_MANUAL.md) for user issues
- Check [ADMIN_GUIDE.md](ADMIN_GUIDE.md) for admin issues
- Contact system administrator

---

**Version:** 1.0.0  
**Last Updated:** October 2026  
**Status:** ✅ Production Ready

Made with ❤️ for Mie Ayam Business
