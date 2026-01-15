# 📚 CODE STRUCTURE EXPLANATION

Penjelasan rinci struktur code untuk pemula.

---

## 📁 Folder Structure Overview

```
PROJEK KEUANGAN/
├── backend/          ← Server (Node.js + Express)
├── frontend/         ← Client (React)
├── README.md         ← Project overview
├── SETUP_GUIDE.md    ← Setup instructions
├── API_DOCUMENTATION.md ← API reference
└── ARCHITECTURE_EXPLANATION.md ← This file
```

---

## 🔙 BACKEND STRUCTURE

### server.js - Main Entry Point

**Apa itu?**
File utama backend yang di-run pertama kali.

**Apa yang dilakukan:**
1. Load environment variables dari `.env`
2. Setup middleware (CORS, JSON parser)
3. Koneksi ke MongoDB
4. Mount routes (API endpoints)
5. Start Express server di port 5000

**Analogi:** Seperti pintu depan rumah, semua request masuk sini.

---

### db.js - Database Connection

**Apa itu?**
File untuk manage koneksi ke MongoDB.

**Apa yang dilakukan:**
1. Ambil MongoDB URI dari `.env`
2. Connect ke database
3. Return true jika sukses, error jika gagal

**Kapan dijalankan?**
Di awal `server.js`

---

### models/ - Database Schemas

**Apa itu?**
Mendefinisikan struktur data di database.

**File di folder ini:**
- `Transaction.js` - Schema untuk transaksi
- `SavingGoal.js` - Schema untuk saving goals

**Analogi:** Seperti "form template" - menentukan field apa saja yang boleh ada.

**Contoh (Transaction.js):**
```javascript
// Ini mendefinisikan bahwa setiap transaction HARUS punya:
{
  assetType: String,           // "crypto", "cash", atau "gold"
  assetName: String,           // "Bitcoin", "Rupiah", dll
  nominal: Number,             // 5000000
  transactionDate: Date,       // 2025-12-27
  description: String,         // Optional
  createdAt: Date,             // Auto
  updatedAt: Date              // Auto
}
```

**Validation:**
```javascript
// assetType hanya bisa salah satu dari ketiga value
enum: ['crypto', 'cash', 'gold']

// nominal harus lebih besar dari 0
min: [0, 'Nominal harus positif']

// assetName minimal 2 karakter
minlength: [2, 'Nama asset minimal 2 karakter']
```

---

### controllers/ - Business Logic

**Apa itu?**
Tempat semua "logic" atau "rumus" aplikasi berada.

**File di folder ini:**
- `transactionController.js` - Logic untuk transactions
- `savingGoalController.js` - Logic untuk saving goals

**Apa yang dilakukan?**
Setiap function di controller menangani satu operasi:

**Contoh - createTransaction():**
```javascript
exports.createTransaction = async (req, res) => {
  // 1. Ambil data dari request (frontend)
  const { assetType, assetName, nominal } = req.body;
  
  // 2. Validasi data
  if (!assetName) {
    return res.status(400).json({
      success: false,
      message: 'Nama asset harus diisi'
    });
  }
  
  // 3. Buat object baru
  const transaction = new Transaction({
    assetType,
    assetName,
    nominal
  });
  
  // 4. Simpan ke database
  await transaction.save();
  
  // 5. Kembalikan response ke frontend
  res.status(201).json({
    success: true,
    data: transaction
  });
}
```

**Analogi:** Seperti "instruction manual" - langkah demi langkah apa yang harus dilakukan.

---

### routes/ - API Endpoints

**Apa itu?**
Mendefinisikan "jalan" untuk akses backend dari frontend.

**File di folder ini:**
- `transactionRoutes.js` - Routes untuk transactions
- `savingGoalRoutes.js` - Routes untuk saving goals

**Apa yang dilakukan?**
Mapping HTTP method + path ke controller function.

**Contoh (transactionRoutes.js):**
```javascript
router.post('/', transactionController.createTransaction);
// POST /api/transactions → jalankan createTransaction()

router.get('/', transactionController.getTransactions);
// GET /api/transactions → jalankan getTransactions()

router.delete('/:id', transactionController.deleteTransaction);
// DELETE /api/transactions/123 → jalankan deleteTransaction(123)
```

**Analogi:** Seperti "meja di restaurant" - menentukan nomor berapa (route) untuk duduk di mana (handler function).

---

### middleware/ - Request Processing

**Apa itu?**
Middleware adalah function yang jalan SEBELUM request sampai ke controller.

**Contoh (future implementation):**
```javascript
// Authentication middleware
app.use(authMiddleware); // Semua request di-check dulu login atau tidak

// Logging middleware
app.use(loggerMiddleware); // Log setiap request ke file
```

**Sekarang:** Folder ini kosong, tapi siap untuk implementasi later.

---

### .env - Environment Variables

**Apa itu?**
File untuk menyimpan informasi sensitif atau konfigurasi.

**Kenapa tidak hardcoded di code?**
- Security: Jangan commit file ini ke Git
- Flexibility: Bisa punya berbeda config di development vs production
- Privacy: Informasi sensitif (password, API keys) tersimpan aman

**Contoh:**
```env
MONGODB_URI=mongodb://localhost:27017/keuangan-app
PORT=5000
```

**Di code:**
```javascript
const mongoURI = process.env.MONGODB_URI; // Ambil dari .env
```

---

## 🎨 FRONTEND STRUCTURE

### App.jsx - Main Component

**Apa itu?**
Component utama yang render semua page.

**Apa yang dilakukan:**
1. Setup Router (React Router)
2. Render Navbar
3. Setup Routes (path → component mapping)
4. Render Footer

**Struktur:**
```javascript
<BrowserRouter>
  <Navbar>
    {/* Navigation links */}
  </Navbar>
  
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/input" element={<InputTransaksi />} />
    <Route path="/laporan" element={<LaporanTransaksi />} />
  </Routes>
  
  <Footer />
</BrowserRouter>
```

**Analogi:** Seperti "main template" website yang semua page inherit.

---

### pages/ - Page Components

**Apa itu?**
Setiap file = satu halaman lengkap.

**File di folder ini:**
- `Dashboard.jsx` - Halaman dashboard
- `InputTransaksi.jsx` - Form input transaksi
- `LaporanTransaksi.jsx` - Tabel laporan transaksi

---

### pages/Dashboard.jsx

**Apa yang ditampilkan:**
1. Total aset keseluruhan
2. Breakdown per tipe aset (Crypto, Cash, Gold)
3. Tabel 10 transaksi terbaru

**Flow:**
```javascript
// 1. Component mount (load page)
useEffect(() => {
  fetchDashboardData(); // Panggil API
}, []);

// 2. API panggil backend
const fetchDashboardData = async () => {
  const response = await transactionService.getDashboardSummary();
  setSummary(response.data.data); // Store data di state
}

// 3. Render data di JSX
return (
  <div>
    <h2>{summary.totalAssets}</h2> {/* Display total assets */}
  </div>
)
```

---

### pages/InputTransaksi.jsx

**Apa yang ditampilkan:**
Form input untuk transaksi baru.

**Flow:**
```javascript
// 1. User input data di form
<input name="assetName" onChange={handleInputChange} />

// 2. State terupdate
const [formData, setFormData] = useState({
  assetName: "Bitcoin", // User input
  nominal: 5000000
});

// 3. User klik "Simpan"
const handleSubmit = async (e) => {
  // Validasi
  if (!formData.assetName) return setError('assetName required');
  
  // API call
  await transactionService.create(formData);
  
  // Success message
  setSuccess(true);
}

// 4. Render success/error message
{success && <div>Transaksi berhasil!</div>}
{error && <div>Error: {error}</div>}
```

---

### pages/LaporanTransaksi.jsx

**Apa yang ditampilkan:**
1. Filter section (assetType, date range)
2. Tabel semua transaksi
3. Button delete, export CSV

**Flow:**
```javascript
// 1. Setup state
const [transactions, setTransactions] = useState([]);
const [filters, setFilters] = useState({
  assetType: '',
  startDate: '',
  endDate: ''
});

// 2. Fetch saat filter berubah
useEffect(() => {
  fetchTransactions(); // Call API dengan filter
}, [filters]);

// 3. Delete transaction
const handleDelete = async (id) => {
  if (confirm('Yakin?')) {
    await transactionService.delete(id);
    setTransactions(prev => prev.filter(t => t._id !== id));
  }
}

// 4. Export CSV
const handleExportCSV = () => {
  // Create CSV file
  // Trigger download
}
```

---

### services/api.js - API Communication

**Apa itu?**
Centralized place untuk semua API calls.

**Kenapa separate?**
- Maintainability: Mudah ubah API endpoint
- Reusability: Bisa dipakai di multiple pages
- Organization: Semua API calls di satu tempat

**Contoh:**
```javascript
// Define API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({ baseURL: API_BASE_URL });

// Export organized services
export const transactionService = {
  create: (data) => api.post('/transactions', data),
  getAll: (filters) => api.get('/transactions', { params: filters }),
  delete: (id) => api.delete(`/transactions/${id}`)
};
```

**Penggunaan di page:**
```javascript
// Import
import { transactionService } from '../services/api';

// Gunakan
const response = await transactionService.create(formData);
```

---

### index.css - Global Styles

**Apa itu?**
Styling global dan Tailwind CSS setup.

**Apa yang ada:**
```css
@tailwind base;        /* Reset browser default styles */
@tailwind components;  /* Reusable component classes */
@tailwind utilities;   /* Utility classes (padding, margin, dll) */

/* Custom utility classes */
.card { ... }          /* Reusable card styling */
.btn { ... }           /* Button styling */
.input-field { ... }   /* Form input styling */
```

---

### main.jsx - React Entry Point

**Apa itu?**
File yang di-run pertama kali saat app start.

**Apa yang dilakukan:**
```javascript
// 1. Import React
import React from 'react'
import ReactDOM from 'react-dom/client'

// 2. Import main App component
import App from './App.jsx'
import './index.css'

// 3. Render App ke DOM
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
```

---

### index.html - HTML Entry Point

**Apa itu?**
HTML file utama yang di-load browser.

**Apa yang ada:**
```html
<html>
  <head>
    <title>Keuangan App</title>
  </head>
  <body>
    <div id="root"></div>  <!-- App di-render ke sini -->
    <script src="/src/main.jsx"></script> <!-- Load React app -->
  </body>
</html>
```

---

## 🔄 Data Flow Diagram

### Scenario: User Input Transaksi Baru

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER INPUT AT FRONTEND                                    │
│    User fills form → InputTransaksi.jsx                     │
│    - assetType: "crypto"                                    │
│    - assetName: "Bitcoin"                                   │
│    - nominal: 5000000                                       │
│    Click "Simpan Transaksi" button                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. API CALL FROM FRONTEND                                    │
│    transactionService.create(formData)                      │
│    axios.post('/api/transactions', formData)                │
│    HTTP POST request di-send ke backend                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKEND RECEIVE REQUEST                                   │
│    server.js → routes → transactionController               │
│    createTransaction() function di-jalankan                 │
│    - Validate data                                          │
│    - Check required fields                                  │
│    - Check nominal is positive                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SAVE TO DATABASE                                          │
│    Create new Transaction model instance                    │
│    Save ke MongoDB                                          │
│    Database auto-generate _id, createdAt, updatedAt         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. BACKEND SEND RESPONSE                                     │
│    res.status(201).json({                                   │
│      success: true,                                         │
│      data: { _id, assetType, ... }                          │
│    })                                                        │
│    HTTP response di-send ke frontend                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. FRONTEND RECEIVE RESPONSE                                 │
│    InputTransaksi.jsx handle response                       │
│    - setSuccess(true) → Show green message                  │
│    - Reset form                                             │
│    - Hide message after 3 seconds                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 MVC Pattern Explanation

Project ini follow **MVC** (Model-View-Controller) pattern:

**Model** = Database Schema
- `models/Transaction.js`
- `models/SavingGoal.js`
- Defines data structure

**View** = Frontend UI
- `pages/Dashboard.jsx`
- `pages/InputTransaksi.jsx`
- `pages/LaporanTransaksi.jsx`
- What user see

**Controller** = Business Logic
- `controllers/transactionController.js`
- `controllers/savingGoalController.js`
- How data is processed

**Flow:**
```
User Input (View)
    ↓
API Call
    ↓
Controller (Process Logic)
    ↓
Model (Save/Get Data)
    ↓
Database
    ↓
Model (Retrieve)
    ↓
Controller (Format Response)
    ↓
API Response
    ↓
View (Display)
```

---

## 📚 Learning Path

1. **Start dengan App.jsx**
   - Understand routing
   - Understand component structure

2. **Go to Dashboard.jsx**
   - Understand useEffect
   - Understand useState
   - Understand API calls

3. **Go to InputTransaksi.jsx**
   - Understand form handling
   - Understand form validation
   - Understand error/success handling

4. **Go to LaporanTransaksi.jsx**
   - Understand filtering
   - Understand table rendering
   - Understand CRUD operations

5. **Learn Backend**
   - Start dengan server.js
   - Understand db.js connection
   - Understand routes (what endpoint what function)
   - Understand controllers (what logic for each operation)
   - Understand models (schema validation)

---

## 💡 Tips untuk Learning

1. **Read code slowly** - Take time to understand
2. **Add comments** - Understand why each line exists
3. **Modify small thing** - Try change styling, labels, etc
4. **Test in browser** - See what change happens
5. **Check browser console** - Understand errors
6. **Check terminal** - See backend logs

---

**Keep Learning! 🚀**
