# 📡 API DOCUMENTATION

Dokumentasi lengkap semua API endpoints yang tersedia.

---

## Base URL
```
http://localhost:5000/api
```

---

## 1️⃣ TRANSACTIONS API

### 1.1 Get Dashboard Summary

**GET** `/transactions/dashboard/summary`

Ambil ringkasan data untuk dashboard (total aset, breakdown per type, recent transactions)

**Response Example:**
```json
{
  "success": true,
  "message": "Dashboard summary berhasil diambil",
  "data": {
    "totalAssets": 15000000,
    "byAssetType": [
      {
        "_id": "crypto",
        "total": 10000000,
        "count": 2
      },
      {
        "_id": "cash",
        "total": 5000000,
        "count": 1
      }
    ],
    "recentTransactions": [
      {
        "_id": "65...",
        "assetType": "crypto",
        "assetName": "Bitcoin",
        "nominal": 10000000,
        "transactionDate": "2025-12-27T00:00:00.000Z",
        "description": "Beli Bitcoin"
      }
    ]
  }
}
```

---

### 1.2 Create New Transaction

**POST** `/transactions`

Membuat transaksi baru.

**Request Body:**
```json
{
  "assetType": "crypto",          // Required: "crypto" | "cash" | "gold"
  "assetName": "Bitcoin",         // Required: String
  "nominal": 5000000,             // Required: Number (positive)
  "transactionDate": "2025-12-27", // Required: Date (format: YYYY-MM-DD)
  "description": "Beli Bitcoin untuk long term" // Optional: String
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Transaksi berhasil ditambahkan",
  "data": {
    "_id": "65...",
    "assetType": "crypto",
    "assetName": "Bitcoin",
    "nominal": 5000000,
    "transactionDate": "2025-12-27T00:00:00.000Z",
    "description": "Beli Bitcoin untuk long term",
    "createdAt": "2025-12-27T10:30:00.000Z",
    "updatedAt": "2025-12-27T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Semua field required harus diisi"
}
```

---

### 1.3 Get All Transactions

**GET** `/transactions`

Mengambil semua transaksi dengan optional filters.

**Query Parameters:**
```
?assetType=crypto
?startDate=2025-01-01
?endDate=2025-12-31
```

**Example Request:**
```
GET /transactions?assetType=crypto&startDate=2025-01-01&endDate=2025-12-31
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Data transaksi berhasil diambil",
  "total": 2,
  "data": [
    {
      "_id": "65...",
      "assetType": "crypto",
      "assetName": "Bitcoin",
      "nominal": 10000000,
      "transactionDate": "2025-12-27T00:00:00.000Z",
      "description": "Beli Bitcoin",
      "createdAt": "2025-12-27T10:30:00.000Z",
      "updatedAt": "2025-12-27T10:30:00.000Z"
    },
    {
      "_id": "65...",
      "assetType": "crypto",
      "assetName": "Ethereum",
      "nominal": 3000000,
      "transactionDate": "2025-12-26T00:00:00.000Z",
      "description": "Beli Ethereum",
      "createdAt": "2025-12-26T09:00:00.000Z",
      "updatedAt": "2025-12-26T09:00:00.000Z"
    }
  ]
}
```

---

### 1.4 Get Single Transaction

**GET** `/transactions/:id`

Mengambil satu transaksi berdasarkan ID.

**URL Parameter:**
```
:id = Transaction ID (MongoDB ObjectId)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Data transaksi berhasil diambil",
  "data": {
    "_id": "65...",
    "assetType": "crypto",
    "assetName": "Bitcoin",
    "nominal": 10000000,
    "transactionDate": "2025-12-27T00:00:00.000Z",
    "description": "Beli Bitcoin",
    "createdAt": "2025-12-27T10:30:00.000Z",
    "updatedAt": "2025-12-27T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Transaksi tidak ditemukan"
}
```

---

### 1.5 Update Transaction

**PUT** `/transactions/:id`

Update data transaksi yang sudah ada.

**URL Parameter:**
```
:id = Transaction ID
```

**Request Body:** (sama seperti POST, tapi semua opsional kecuali salah satu field)
```json
{
  "assetType": "crypto",
  "assetName": "Bitcoin",
  "nominal": 6000000,
  "transactionDate": "2025-12-27",
  "description": "Update keterangan"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transaksi berhasil diupdate",
  "data": {
    "_id": "65...",
    "assetType": "crypto",
    "assetName": "Bitcoin",
    "nominal": 6000000,
    "transactionDate": "2025-12-27T00:00:00.000Z",
    "description": "Update keterangan",
    "createdAt": "2025-12-27T10:30:00.000Z",
    "updatedAt": "2025-12-27T11:00:00.000Z"
  }
}
```

---

### 1.6 Delete Transaction

**DELETE** `/transactions/:id`

Menghapus transaksi.

**URL Parameter:**
```
:id = Transaction ID
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Transaksi berhasil dihapus",
  "data": {
    "_id": "65...",
    "assetType": "crypto",
    "assetName": "Bitcoin",
    "nominal": 10000000,
    "transactionDate": "2025-12-27T00:00:00.000Z",
    "description": "Beli Bitcoin",
    "createdAt": "2025-12-27T10:30:00.000Z",
    "updatedAt": "2025-12-27T10:30:00.000Z"
  }
}
```

---

## 2️⃣ SAVING GOALS API

### 2.1 Create New Saving Goal

**POST** `/goals`

Membuat saving goal baru.

**Request Body:**
```json
{
  "goalName": "Nabung untuk liburan",        // Required: String
  "targetAmount": 50000000,                  // Required: Number
  "currentAmount": 15000000,                 // Optional: Number (default 0)
  "deadline": "2026-12-31",                  // Required: Date (format: YYYY-MM-DD)
  "description": "Liburan ke Bali"          // Optional: String
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Saving goal berhasil ditambahkan",
  "data": {
    "_id": "65...",
    "goalName": "Nabung untuk liburan",
    "targetAmount": 50000000,
    "currentAmount": 15000000,
    "deadline": "2026-12-31T00:00:00.000Z",
    "description": "Liburan ke Bali",
    "status": "active",
    "createdAt": "2025-12-27T10:30:00.000Z",
    "updatedAt": "2025-12-27T10:30:00.000Z"
  }
}
```

---

### 2.2 Get All Saving Goals

**GET** `/goals`

Mengambil semua saving goals dengan optional filter status.

**Query Parameters:**
```
?status=active    // "active" | "completed" | "cancelled"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Data saving goals berhasil diambil",
  "total": 1,
  "data": [
    {
      "_id": "65...",
      "goalName": "Nabung untuk liburan",
      "targetAmount": 50000000,
      "currentAmount": 15000000,
      "deadline": "2026-12-31T00:00:00.000Z",
      "description": "Liburan ke Bali",
      "status": "active",
      "createdAt": "2025-12-27T10:30:00.000Z",
      "updatedAt": "2025-12-27T10:30:00.000Z"
    }
  ]
}
```

---

### 2.3 Get Single Saving Goal

**GET** `/goals/:id`

Mengambil satu saving goal berdasarkan ID.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Data saving goal berhasil diambil",
  "data": {
    "_id": "65...",
    "goalName": "Nabung untuk liburan",
    "targetAmount": 50000000,
    "currentAmount": 15000000,
    "deadline": "2026-12-31T00:00:00.000Z",
    "description": "Liburan ke Bali",
    "status": "active",
    "createdAt": "2025-12-27T10:30:00.000Z",
    "updatedAt": "2025-12-27T10:30:00.000Z"
  }
}
```

---

### 2.4 Update Saving Goal

**PUT** `/goals/:id`

Update saving goal yang sudah ada.

**Request Body:** (semua opsional)
```json
{
  "currentAmount": 25000000,
  "status": "active"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Saving goal berhasil diupdate",
  "data": {
    "_id": "65...",
    "goalName": "Nabung untuk liburan",
    "targetAmount": 50000000,
    "currentAmount": 25000000,
    "deadline": "2026-12-31T00:00:00.000Z",
    "description": "Liburan ke Bali",
    "status": "active",
    "createdAt": "2025-12-27T10:30:00.000Z",
    "updatedAt": "2025-12-27T11:00:00.000Z"
  }
}
```

---

### 2.5 Delete Saving Goal

**DELETE** `/goals/:id`

Menghapus saving goal.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Saving goal berhasil dihapus",
  "data": {
    "_id": "65...",
    "goalName": "Nabung untuk liburan",
    "targetAmount": 50000000,
    "currentAmount": 15000000,
    "deadline": "2026-12-31T00:00:00.000Z",
    "description": "Liburan ke Bali",
    "status": "active",
    "createdAt": "2025-12-27T10:30:00.000Z",
    "updatedAt": "2025-12-27T10:30:00.000Z"
  }
}
```

---

## 3️⃣ GENERAL ENDPOINTS

### 3.1 Health Check

**GET** `/health`

Check apakah backend running atau tidak.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Backend is running",
  "timestamp": "2025-12-27T10:30:00.000Z"
}
```

---

## 🔍 Testing dengan cURL

### Test Create Transaction
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "assetType": "crypto",
    "assetName": "Bitcoin",
    "nominal": 5000000,
    "transactionDate": "2025-12-27",
    "description": "Test transaction"
  }'
```

### Test Get All Transactions
```bash
curl http://localhost:5000/api/transactions
```

### Test Get Dashboard Summary
```bash
curl http://localhost:5000/api/transactions/dashboard/summary
```

---

## 📊 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource berhasil dibuat |
| 400 | Bad Request - Validasi gagal |
| 404 | Not Found - Resource tidak ditemukan |
| 500 | Server Error - Error pada server |

---

## 🔐 Error Handling

Semua error response mengikuti format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (jika ada)"
}
```

---

Untuk questions atau issues, check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
