# 📱 PANDUAN DEPLOYMENT FINANCE MONITOR
## Akses dari HP & Laptop Dimanapun - 100% GRATIS!

---

## 🎯 ARSITEKTUR HOSTING GRATIS

### 1. **Database**: MongoDB Atlas (Free Tier)
- 512 MB storage GRATIS selamanya
- Shared cluster
- Unlimited connections

### 2. **Backend API**: Render.com (Free Tier)
- 750 jam/bulan GRATIS
- Auto sleep setelah 15 menit tidak aktif
- Support Node.js + MongoDB

### 3. **Frontend**: Vercel (Free Tier)
- Unlimited bandwidth
- Auto deploy dari Git
- HTTPS gratis
- Custom domain support

---

## 📋 LANGKAH-LANGKAH DEPLOYMENT

### STEP 1: Setup MongoDB Atlas (Database Cloud)

1. **Daftar MongoDB Atlas**
   - Buka: https://www.mongodb.com/cloud/atlas/register
   - Sign up dengan Google atau email
   - Pilih **FREE** tier (M0 Sandbox)
   - Pilih region: **Singapore** atau **Sydney** (terdekat)

2. **Buat Cluster**
   - Cluster Name: `finance-monitor-db`
   - Provider: AWS
   - Region: Singapore (ap-southeast-1)
   - Cluster Tier: **M0 Sandbox (FREE)**
   - Klik **Create Cluster** (tunggu 3-5 menit)

3. **Setup Database Access**
   - Menu: Database Access → Add New Database User
   - Username: `financeadmin`
   - Password: Generate password aman (SIMPAN INI!)
   - Database User Privileges: **Read and write to any database**
   - Add User

4. **Setup Network Access**
   - Menu: Network Access → Add IP Address
   - Pilih: **Allow Access from Anywhere** (0.0.0.0/0)
   - Confirm

5. **Dapatkan Connection String**
   - Menu: Database → Connect
   - Choose: **Connect your application**
   - Driver: Node.js
   - Copy connection string:
     ```
     mongodb+srv://financeadmin:<password>@finance-monitor-db.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Ganti `<password>` dengan password yang tadi dibuat
   - SIMPAN STRING INI!

---

### STEP 2: Deploy Backend ke Render.com

1. **Push Backend ke GitHub**
   ```bash
   # Di folder projek
   cd "C:\Users\bahba\OneDrive\Dokumen\Dokumen Pribadi Eden\Projek Keuangan"
   
   # Buat .gitignore jika belum ada
   echo "node_modules/" > .gitignore
   echo ".env" >> .gitignore
   echo "*.log" >> .gitignore
   
   # Initialize git (jika belum)
   git init
   git add .
   git commit -m "Initial commit - Finance Monitor"
   
   # Buat repo di GitHub (lewat web github.com)
   # Lalu push:
   git remote add origin https://github.com/USERNAME/finance-monitor.git
   git branch -M main
   git push -u origin main
   ```

2. **Daftar Render.com**
   - Buka: https://render.com/
   - Sign up dengan GitHub
   - Authorize Render untuk akses repo

3. **Deploy Backend**
   - Dashboard Render → New → Web Service
   - Connect repository: `finance-monitor`
   - Settings:
     - **Name**: `finance-monitor-api`
     - **Region**: Singapore
     - **Branch**: main
     - **Root Directory**: `backend`
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Instance Type**: Free

4. **Environment Variables**
   Klik "Advanced" → Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://financeadmin:PASSWORD@finance-monitor-db.xxxxx.mongodb.net/finance?retryWrites=true&w=majority
   CORS_ORIGIN=https://finance-monitor.vercel.app
   ```
   (Ganti PASSWORD dan URL sesuai MongoDB Atlas Anda)

5. **Deploy**
   - Klik **Create Web Service**
   - Tunggu build selesai (~3-5 menit)
   - Catat URL backend: `https://finance-monitor-api.onrender.com`

---

### STEP 3: Deploy Frontend ke Vercel

1. **Update API URL di Frontend**
   - Edit file: `frontend/src/services/api.js`
   - Ganti `baseURL` dengan URL backend Render:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://finance-monitor-api.onrender.com'
   ```

2. **Buat Environment File**
   - Di folder `frontend/`, buat file `.env.production`:
   ```
   VITE_API_URL=https://finance-monitor-api.onrender.com
   ```

3. **Push Update ke GitHub**
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push
   ```

4. **Deploy ke Vercel**
   - Buka: https://vercel.com/
   - Sign up dengan GitHub
   - New Project → Import `finance-monitor`
   - Settings:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Environment Variables:
     ```
     VITE_API_URL=https://finance-monitor-api.onrender.com
     ```
   - Klik **Deploy**

5. **Dapatkan URL**
   - Setelah deploy selesai, Vercel akan kasih URL:
     ```
     https://finance-monitor-xxxxx.vercel.app
     ```
   - Bisa custom domain GRATIS!

---

## 📱 CARA AKSES DARI HP

1. **Buka Browser di HP** (Chrome/Safari)
2. **Ketik URL**: `https://finance-monitor-xxxxx.vercel.app`
3. **Add to Home Screen**:
   - **Android**: Menu (⋮) → Add to Home screen
   - **iPhone**: Share → Add to Home Screen
4. **Sekarang bisa buka seperti aplikasi!**

---

## 🔧 TIPS OPTIMASI

### 1. **Foto Otomatis Terkompresi**
✅ Sudah diimplementasi! Setiap foto auto compress ke max 500KB

### 2. **Backend Auto-Sleep**
⚠️ Backend Render sleep setelah 15 menit tidak aktif
- Akses pertama: ~30 detik loading (backend bangun)
- Akses selanjutnya: langsung cepat

**Solusi**: Pakai cron-job.org untuk ping backend tiap 10 menit
- Daftar: https://cron-job.org/
- Create job: GET `https://finance-monitor-api.onrender.com/api/health`
- Interval: Every 10 minutes

### 3. **Backup Database**
- MongoDB Atlas punya auto backup
- Export manual: Database → Collections → Export
- Import: Database → Collections → Import

### 4. **Monitor Usage**
- Render: Dashboard → Web Service → Logs
- Vercel: Dashboard → Project → Analytics
- MongoDB: Atlas → Metrics

---

## 💾 BATASAN FREE TIER

| Service | Limit | Solusi |
|---------|-------|--------|
| MongoDB Atlas | 512 MB | Hapus data lama, export berkala |
| Render Backend | 750 jam/bulan | Cukup untuk 1 bulan (cron-job.org aktif) |
| Vercel Frontend | Unlimited | No worries! |
| Foto Storage | Base64 di MongoDB | Max 500KB per foto (auto compress) |

---

## 🚨 TROUBLESHOOTING

### Backend Sleep Lama
- Render free tier sleep otomatis
- Akses pertama selalu lambat (~30s)
- Gunakan cron-job untuk keep alive

### CORS Error
- Pastikan `CORS_ORIGIN` di Render sesuai URL Vercel
- Update jika ganti domain

### Database Connection Error
- Cek MongoDB Atlas → Network Access → 0.0.0.0/0 allowed
- Cek password di connection string benar
- Cek whitelist IP di MongoDB

### Foto Tidak Muncul
- Cek size foto < 16MB (limit MongoDB document)
- Kompresi otomatis akan kecilkan ke ~100-500KB

---

## 📊 ESTIMASI KAPASITAS

Dengan free tier:
- **MongoDB 512MB** bisa simpan:
  - ~50,000 transaksi (tanpa foto)
  - ~1,000 transaksi dengan foto (500KB each)
  - Mix: ~10,000 transaksi + 200 foto

**Rekomendasi**: 
- Export data tiap 6 bulan
- Hapus data lama yang sudah di-backup
- Pakai foto hanya untuk transaksi penting

---

## 🎉 SELESAI!

Sekarang Finance Monitor bisa diakses dari:
- ✅ Laptop (WiFi rumah/kantor)
- ✅ HP (dimana saja, pakai data/WiFi)
- ✅ Tablet
- ✅ Komputer teman (login dari browser)

**URL Anda**:
- Frontend: `https://finance-monitor-xxxxx.vercel.app`
- Backend: `https://finance-monitor-api.onrender.com`

**Bookmark** atau **Add to Home Screen** di HP untuk akses cepat!

---

## 📞 SUPPORT

Jika ada masalah:
1. Cek Render logs: Dashboard → Service → Logs
2. Cek Vercel logs: Dashboard → Deployments → Logs
3. Cek MongoDB Atlas: Clusters → Metrics

Happy tracking! 💰📊
