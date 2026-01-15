# 💰 Keuangan App - Personal Finance Monitor

Aplikasi web untuk monitoring keuangan pribadi Anda dengan fitur input transaksi, laporan, dan dashboard.

## 📋 Fitur Utama

### 1. **Dashboard** 📊
- Ringkasan total aset keseluruhan
- Breakdown per tipe aset (Crypto, Cash, Gold)
- Tampil 10 transaksi terbaru
- Real-time summary data

### 2. **Input Transaksi** 📝
- Form input transaksi dengan validasi
- Pilihan jenis aset: Cryptocurrency, Cash, Emas
- Input nominal dalam Rupiah
- Field keterangan opsional
- Real-time form validation

### 3. **Laporan Transaksi** 📋
- Tabel lengkap semua transaksi
- Filter berdasarkan jenis aset
- Filter berdasarkan range tanggal
- Tombol Delete untuk menghapus transaksi
- Export data ke Excel (.xlsx) dengan 2 sheet
  - Sheet 1: Data transaksi lengkap
  - Sheet 2: Ringkasan (total transaksi, total nominal, rata-rata)
- Summary statistik (Total, Rata-rata)

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - Web framework
- **MongoDB** - Database NoSQL
- **Mongoose** - Database ODM
- **CORS** - Cross-origin requests
- **dotenv** - Environment variables

### Frontend
- **React 18** - UI library
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Recharts** - Chart library (untuk future enhancement)
- **XLSX** - Export ke Excel
- **Vite** - Development server & bundler

---

## 📁 Struktur Project

```
PROJEK KEUANGAN/
├── backend/
│   ├── models/
│   │   ├── Transaction.js       # Schema untuk transaksi
│   │   └── SavingGoal.js        # Schema untuk saving goals
│   ├── controllers/
│   │   ├── transactionController.js    # Business logic transaksi
│   │   └── savingGoalController.js     # Business logic goals
│   ├── routes/
│   │   ├── transactionRoutes.js  # API routes untuk transaksi
│   │   └── savingGoalRoutes.js   # API routes untuk goals
│   ├── middleware/              # Middleware (untuk future)
│   ├── db.js                   # Database connection
│   ├── server.js               # Main server file
│   ├── package.json            # Dependencies backend
│   ├── .env                    # Environment variables
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components (future)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Dashboard page
│   │   │   ├── InputTransaksi.jsx   # Input form page
│   │   │   └── LaporanTransaksi.jsx # Report page
│   │   ├── services/
│   │   │   └── api.js          # API calls centralized
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles + Tailwind
│   ├── public/                 # Static assets
│   ├── index.html              # HTML entry point
│   ├── vite.config.js          # Vite config
│   ├── tailwind.config.js      # Tailwind config
│   ├── postcss.config.js       # PostCSS config
│   ├── package.json            # Dependencies frontend
│   ├── .gitignore
│
└── README.md                   # This file
```

---

## 🚀 Cara Setup & Run

### Prerequisites
- Node.js versi 16+ sudah terinstall
- MongoDB sudah running (local atau cloud)

### Step 1: Setup Backend

```bash
# Navigate ke folder backend
cd backend

# Install dependencies
npm install

# Setup environment variables (.env sudah ada)
# Edit .env jika perlu (MongoDB URI, Port, etc)

# Run backend server
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### Step 2: Setup Frontend (Di terminal baru)

```bash
# Navigate ke folder frontend
cd frontend

# Install dependencies
npm install

# Run frontend development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

### Step 3: Buka Browser

Buka [http://localhost:3000](http://localhost:3000) dan aplikasi siap digunakan!

---

## 📚 API Endpoints

### Transactions
- `POST /api/transactions` - Buat transaksi baru
- `GET /api/transactions` - Ambil semua transaksi (dengan filter opsional)
- `GET /api/transactions/:id` - Ambil satu transaksi
- `PUT /api/transactions/:id` - Update transaksi
- `DELETE /api/transactions/:id` - Hapus transaksi
- `GET /api/transactions/dashboard/summary` - Dashboard summary

### Saving Goals
- `POST /api/goals` - Buat goal baru
- `GET /api/goals` - Ambil semua goals
- `GET /api/goals/:id` - Ambil satu goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Hapus goal

---

## 💾 Database Schema

### Transaction
```javascript
{
  assetType: "crypto" | "cash" | "gold",
  assetName: String,
  nominal: Number,
  transactionDate: Date,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### SavingGoal
```javascript
{
  goalName: String,
  targetAmount: Number,
  currentAmount: Number,
  deadline: Date,
  description: String,
  status: "active" | "completed" | "cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Rencana Pengembangan Ke Depan

- [ ] Edit transaksi (sudah ada API, butuh UI)
- [ ] Grafik interaktif di dashboard (Chart.js/Recharts)
- [ ] Kategori transaksi tambahan
- [ ] Import CSV untuk bulk data
- [ ] Authentication & multi-user support
- [ ] Mobile responsive optimization
- [ ] Dark mode
- [ ] Export PDF untuk laporan
- [ ] Notifikasi untuk saving goals
- [ ] Budget planning & alerts

---

## 🐛 Troubleshooting

### "Connection Failed" di Frontend
- Pastikan backend sudah running di port 5000
- Cek CORS origin di `.env` backend

### MongoDB Connection Error
- Pastikan MongoDB sudah running
- Cek connection string di `.env`
- Jika pakai MongoDB Atlas, pastikan IP whitelisted

### Module not found error
- Run `npm install` di folder yang error
- Delete `node_modules` dan `package-lock.json`, lalu `npm install` lagi

---

## 📝 Catatan Penting

1. **Security**: Jangan commit `.env` file ke Git (sudah di `.gitignore`)
2. **CORS**: Frontend dan backend sudah dikonfigurasi untuk berkomunikasi
3. **Development**: Gunakan `npm run dev` untuk development (auto-reload)
4. **Production**: Gunakan `npm run build` untuk production build

---

## 👨‍💻 Author

Created for personal finance monitoring

**Happy tracking your finances! 💎**
