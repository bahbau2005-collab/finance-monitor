# ⚡ QUICK START CHECKLIST

Copy-paste guide yang simple dan cepat untuk setup pertama kali.

---

## ✅ Pre-Setup Checklist

Pastikan sudah punya:
- [ ] Node.js installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] MongoDB running (check: MongoDB Compass or `mongo --version`)

---

## ⚙️ Setup Terminal 1 - BACKEND

```powershell
# 1. Navigate ke backend folder
cd "c:\Users\bahba\OneDrive\Dokumen\Dokumen Pribadi Eden\Projek Keuangan\backend"

# 2. Install dependencies (hanya jalankan 1x)
npm install

# 3. Run backend server (jalankan setiap kali development)
npm run dev

# Expected output:
# ✅ MongoDB connected successfully
# 🚀 Keuangan API Server Running
# Port: 5000
```

**JANGAN CLOSE TERMINAL INI!** ← Backend perlu tetap running

---

## ⚙️ Setup Terminal 2 - FRONTEND (BUKA TERMINAL BARU)

```powershell
# 1. Navigate ke frontend folder
cd "c:\Users\bahba\OneDrive\Dokumen\Dokumen Pribadi Eden\Projek Keuangan\frontend"

# 2. Install dependencies (hanya jalankan 1x)
npm install

# 3. Run frontend server (jalankan setiap kali development)
npm run dev

# Expected output:
# VITE v5.0.0 ready in 234 ms
# Local: http://localhost:3000/
```

---

## 🎉 DONE!

Open browser: **http://localhost:3000**

---

## 📂 Project Structure

```
PROJEK KEUANGAN/
├── backend/                    ← Server (Express + MongoDB)
│   ├── models/                 ← Database schemas
│   ├── controllers/            ← Business logic
│   ├── routes/                 ← API endpoints
│   ├── db.js                   ← Database connection
│   ├── server.js               ← Main server file
│   ├── package.json
│   └── .env
│
├── frontend/                   ← Client (React)
│   ├── src/
│   │   ├── pages/              ← Dashboard, Input, Laporan
│   │   ├── services/           ← API calls
│   │   ├── App.jsx             ← Main component
│   │   └── index.css           ← Global styles
│   ├── package.json
│   └── vite.config.js
│
├── README.md                   ← Project overview
├── SETUP_GUIDE.md              ← Detailed setup
├── API_DOCUMENTATION.md        ← API reference
└── ARCHITECTURE_EXPLANATION.md ← Code structure
```

---

## 🎯 Menu di Aplikasi

1. **Dashboard** (http://localhost:3000/)
   - Lihat total aset
   - Lihat breakdown per tipe
   - Lihat 10 transaksi terbaru

2. **Input Transaksi** (http://localhost:3000/input)
   - Form untuk input transaksi baru
   - Fields: Tipe aset, Nama aset, Nominal, Tanggal, Keterangan

3. **Laporan** (http://localhost:3000/laporan)
   - Tabel semua transaksi
   - Filter & search
   - Delete transaksi
   - Export ke CSV

---

## 🚨 Troubleshooting Quick Fix

| Problem | Solution |
|---------|----------|
| "Cannot connect to backend" | Pastikan backend running di port 5000 |
| "MongoDB connection error" | Start MongoDB service atau check connection string |
| "Module not found" | Run `npm install` di folder yang error |
| "Port already in use" | `Ctrl+C` di terminal, run again |
| "Form input not working" | Check browser console (F12) untuk error |

---

## 💾 Setelah Edit Code

Saat kamu edit file:
- Backend auto-restart (karena `npm run dev` gunakan nodemon)
- Frontend auto-reload (karena vite hot reload)
- Refresh browser jika perlu (F5)

---

## 🛑 Cara Stop Server

```powershell
# Di terminal backend atau frontend
Ctrl + C

# Ini akan stop server
```

---

## 📚 Dokumentasi Lengkap

Baca file-file ini untuk detail lebih:
- `README.md` - Project overview
- `SETUP_GUIDE.md` - Detailed setup & troubleshooting
- `API_DOCUMENTATION.md` - API endpoints reference
- `ARCHITECTURE_EXPLANATION.md` - Code structure explanation

---

## 🎓 Next Steps

Setelah setup berhasil, coba:

1. **Input transaksi** - Buka menu "Input Transaksi" dan coba input
2. **Lihat di dashboard** - Refresh dashboard, cek data muncul
3. **Lihat di laporan** - Buka menu "Laporan" dan filter data
4. **Export CSV** - Coba export transaksi ke Excel

---

## 📞 Need Help?

Check SETUP_GUIDE.md untuk:
- Penjelasan rinci setiap step
- FAQ & common issues
- Cara test API dengan cURL
- Tips untuk development

---

**Happy Coding! 🚀**

---

### ⏱️ Time Breakdown

- Setup backend: ~2 menit (npm install + run)
- Setup frontend: ~2 menit (npm install + run)
- Total: ~4 menit dari folder kosong sampai app running
- (Assuming MongoDB sudah running)
