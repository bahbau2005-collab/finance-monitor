# 📖 SETUP GUIDE UNTUK PEMULA

Guide ini akan memandu Anda step-by-step dari awal sampai aplikasi berjalan.

---

## STEP 1: Install Prerequisites

### 1.1 Install Node.js

1. Kunjungi https://nodejs.org/
2. Download **LTS version** (recommended)
3. Jalankan installer dan ikuti langkah-langkahnya
4. Buka Command Prompt dan verify dengan:
   ```
   node --version
   npm --version
   ```

### 1.2 Install MongoDB

Pilih salah satu:

**Option A: MongoDB Local (Recommended untuk awal)**
1. Kunjungi https://www.mongodb.com/try/download/community
2. Download Community Edition
3. Jalankan installer
4. Saat instalasi, centang "Install MongoD as a Service"
5. Ini akan auto-start MongoDB saat computer boot

**Option B: MongoDB Atlas (Cloud - Free)**
1. Kunjungi https://www.mongodb.com/cloud/atlas
2. Buat akun gratis
3. Buat cluster gratis
4. Copy connection string
5. Paste ke `.env` file di folder backend

---

## STEP 2: Setup Folder Project

1. Buka **Command Prompt** atau **PowerShell**
2. Navigate ke folder "PROJEK KEUANGAN":
   ```powershell
   cd "c:\Users\bahba\OneDrive\Dokumen\Dokumen Pribadi Eden\Projek Keuangan"
   ```

Verifikasi folder structure:
```
PROJEK KEUANGAN/
├── backend/
├── frontend/
└── README.md
```

---

## STEP 3: Setup BACKEND

### 3.1 Install Backend Dependencies

```powershell
# Masuk ke folder backend
cd backend

# Install semua packages yang dibutuhkan
npm install
```

**Apa yang terjadi:**
- npm akan membaca `package.json`
- Download dan install semua dependencies (express, mongoose, cors, dll)
- Buat folder `node_modules/` (jangan utak-atik folder ini)

### 3.2 Cek .env File

File `.env` sudah ada dengan isi:
```
MONGODB_URI=mongodb://localhost:27017/keuangan-app
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Penjelasan:**
- `MONGODB_URI` = Connection string ke MongoDB
- `PORT` = Port dimana backend berjalan
- `NODE_ENV` = Development mode (untuk better error messages)
- `CORS_ORIGIN` = Frontend URL yang diizinkan akses

### 3.3 Jalankan Backend Server

```powershell
# Masih di folder backend
npm run dev
```

**Expected Output:**
```
✅ MongoDB connected successfully

╔════════════════════════════════════════╗
║   🚀 Keuangan API Server Running      ║
║   Port: 5000                           ║
║   Environment: development             ║
╚════════════════════════════════════════╝
```

**Jika ada error:**
- Jika "MongoDB connection error": Pastikan MongoDB sudah running
- Jika "Port 5000 already in use": Ada aplikasi lain pakai port 5000

---

## STEP 4: Setup FRONTEND

**Buka Command Prompt/PowerShell BARU** (jangan close yang lama, backend perlu tetap running)

### 4.1 Install Frontend Dependencies

```powershell
# Navigate ke root project dulu
cd "c:\Users\bahba\OneDrive\Dokumen\Dokumen Pribadi Eden\Projek Keuangan"

# Masuk ke folder frontend
cd frontend

# Install packages
npm install
```

### 4.2 Jalankan Frontend Server

```powershell
# Masih di folder frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

---

## STEP 5: Buka Aplikasi di Browser

1. Buka browser (Chrome, Firefox, Edge, dll)
2. Ketik di address bar: `http://localhost:3000`
3. Tekan Enter

**Congratulations! 🎉** Aplikasi sudah berjalan!

---

## 📝 Cara Menggunakan Aplikasi

### Dashboard Page
- Tampil ringkasan total aset
- Lihat breakdown per tipe aset (Crypto, Cash, Gold)
- Scroll ke bawah untuk lihat 10 transaksi terbaru

### Input Transaksi Page
1. Pilih jenis aset (Crypto, Cash, atau Gold)
2. Input nama aset (contoh: Bitcoin, Rupiah, Emas 24K)
3. Input nominal dalam Rupiah (contoh: 5000000)
4. Pilih tanggal transaksi
5. (Optional) Input deskripsi
6. Klik "Simpan Transaksi"
7. Jika berhasil, akan muncul pesan hijau "Transaksi berhasil disimpan!"

### Laporan Page
- **Filter**: Gunakan filter untuk cari transaksi spesifik
  - Pilih jenis aset
  - Input tanggal awal
  - Input tanggal akhir
  - Klik "Reset Filter" untuk bersihkan
- **Lihat Tabel**: Semua transaksi akan ditampilkan
- **Delete**: Klik tombol "Hapus" di baris transaksi (confirm dulu)
- **Export CSV**: Klik tombol "Export CSV" untuk download ke file Excel

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot GET /api/transactions"
**Penyebab**: Backend tidak running
**Solusi**: Pastikan terminal backend masih aktif dan menampilkan "Keuangan API Server Running"

### Issue 2: "Backend connection error" di browser
**Penyebab**: Port 5000 tidak berjalan
**Solusi**: 
- Buka terminal backend
- Ctrl+C untuk stop
- Jalankan `npm run dev` lagi

### Issue 3: "MongoDB connection error"
**Penyebab**: MongoDB service tidak running
**Solusi**:
- Jika pakai local MongoDB: Buka Services (di Windows) dan start "MongoDB"
- Jika pakai Atlas: Check internet connection dan verifikasi connection string

### Issue 4: npm install error / module not found
**Solusi**:
```powershell
# Delete node_modules folder
rm -r node_modules

# Delete package-lock.json
rm package-lock.json

# Install lagi
npm install
```

---

## 📚 Penjelasan Teknis untuk Pemula

### Apa itu Backend?
Backend adalah "server" yang menangani:
- Menyimpan data ke database
- Memproses data
- Memberikan data ke frontend saat diminta

### Apa itu Frontend?
Frontend adalah "tampilan" yang:
- User lihat di browser
- User interact dengan (klik button, input form, dll)
- Komunikasi dengan backend untuk ambil/simpan data

### Bagaimana Mereka Berkomunikasi?
```
User di Browser
      ↓
  [Input Data]
      ↓
Frontend (React) di localhost:3000
      ↓ (HTTP Request via Axios)
Backend (Express) di localhost:5000
      ↓ (Process & Save)
Database (MongoDB)
      ↓ (Return Data)
Backend (Express)
      ↓ (HTTP Response)
Frontend (React)
      ↓
[Display Data] → User di Browser
```

### File-file Penting

**Backend Files:**
- `server.js` - Main server file yang start backend
- `db.js` - Koneksi ke MongoDB
- `models/` - Struktur data (schema)
- `controllers/` - Business logic (gimana data diproses)
- `routes/` - API endpoints (cara akses data)

**Frontend Files:**
- `App.jsx` - Main component (navbar, routing)
- `pages/` - Page components (Dashboard, Input, Laporan)
- `services/api.js` - Komunikasi dengan backend
- `index.css` - Styling dengan Tailwind

---

## 💡 Tips Untuk Development

1. **Buat dua terminal**: Satu untuk backend, satu untuk frontend
2. **Jangan close terminal**: Jika close, server akan berhenti
3. **Auto-reload**: Saat kamu edit file, server auto-reload
4. **Browser DevTools**: Buka F12 untuk debug (Console tab penting)
5. **Save file**: Ctrl+S untuk save, auto-reload akan trigger

---

## 🎓 Next Steps - Belajar Lebih Lanjut

Setelah sudah berjalan, kamu bisa:

1. **Tambah fitur baru**: Edit file di pages/ atau controllers/
2. **Styling**: Gunakan Tailwind CSS (class-based styling)
3. **Database**: Cek MongoDB collections di MongoDB Compass
4. **API Testing**: Gunakan Postman untuk test API

---

## ❓ FAQ

**Q: Bisakah saya run frontend dan backend dari satu terminal?**
A: Bisa pakai tools seperti `concurrently`, tapi lebih mudah 2 terminal terpisah untuk troubleshooting.

**Q: Bagaimana jika ingin shutdown aplikasi?**
A: Ctrl+C di kedua terminal (backend dan frontend).

**Q: Apakah data tersimpan setelah shutdown?**
A: Ya! Data tersimpan di MongoDB. Saat startup lagi, data masih ada.

**Q: Bisakah akses dari device lain?**
A: Ya, ubah `CORS_ORIGIN` di .env backend ke IP lokal komputer Anda, dan akses via IP:3000.

---

**Jika ada pertanyaan, jangan ragu untuk bertanya! 😊**

Happy Coding! 🚀
