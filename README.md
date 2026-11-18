# SIMRS — Sistem Informasi Manajemen Rumah Sakit

SIMRS merupakan aplikasi berbasis web untuk mengelola proses pelayanan rumah sakit, mulai dari pendaftaran pasien hingga pembayaran.

## 1. Teknologi

- **Frontend:** React.js, Vite, Tailwind CSS
- **Backend Utama:** PHP 8.2, Yii2 Framework
- **Backend Integrasi:** Node.js, Express.js
- **Database:** PostgreSQL 17
- **Autentikasi:** JWT dan Role-Based Access Control (RBAC)
- **Pengujian API:** Postman

## 2. Fitur Aplikasi

- Login dan otorisasi berdasarkan role
- Dashboard
- Manajemen pasien
- Kunjungan dan antrean
- Rekam medis
- Tindakan medis
- Farmasi dan resep obat
- Laboratorium dan integrasi Node.js
- Tagihan dan pembayaran

## 3. Struktur Proyek

```text
SIMRS/
├── backend-yii/     # REST API utama Yii2
├── backend-node/    # API integrasi laboratorium
├── frontend/        # React.js
├── database/        # Schema SQL dan ERD
├── postman/         # Collection dan Environment
├── docs/            # Dokumentasi teknis PDF
└── README.md
```

## 4. Persyaratan Sistem

Pastikan perangkat telah terinstal:

- PHP 8.2 beserta ekstensi yang diperlukan, termasuk PostgreSQL dan BCMath
- Composer
- Node.js dan npm
- PostgreSQL 17
- Git

## 5. Instalasi dan Konfigurasi

### A. Database PostgreSQL

1. Jalankan PostgreSQL.
2. Buat database bernama `simrs`.
3. Sesuaikan konfigurasi koneksi PostgreSQL pada backend Yii2 dan Node.js.
4. Jalankan migration Yii2 untuk membuat struktur database.

File `database/schema.sql` tersedia sebagai referensi skema database. Untuk instalasi baru, gunakan migration sebagai metode utama dan jangan menjalankan keduanya sekaligus.

### B. Backend Yii2

Masuk ke folder backend:

```bash
cd backend-yii
composer install
```

Salin `.env.example` menjadi `.env`, kemudian sesuaikan JWT secret dan password akun pengujian.

Pastikan konfigurasi koneksi PostgreSQL pada Yii2 sesuai dengan database lokal.

Jalankan migration:

```bash
php yii migrate
```

Buat akun administrator dan petugas:

```bash
php yii seed/admin
php yii seed/users
```

Jalankan server:

```bash
php yii serve --port=8080
```

Backend Yii2 berjalan di:

`http://localhost:8080/api`

### C. Backend Node.js

Buka terminal baru:

```bash
cd backend-node
npm install
```

Salin `.env.example` menjadi `.env`, lalu sesuaikan konfigurasi database.

Jalankan:

```bash
npm run dev
```

Backend Node.js berjalan di:

`http://localhost:3001/api`

### D. Frontend React

Buka terminal baru:

```bash
cd frontend
npm install
```

Salin `.env.example` menjadi `.env`.

Konfigurasi API:

```dotenv
VITE_YII_API_URL=http://localhost:8080/api
VITE_NODE_API_URL=http://localhost:3001/api
```

Jalankan:

```bash
npm run dev
```

Akses aplikasi melalui:

`http://localhost:5173`

## 6. Akun dan Hak Akses

Aplikasi mendukung enam role:

- ADMIN
- REGISTRATION
- DOCTOR
- PHARMACY
- LABORATORY
- CASHIER

Akun pengujian dibuat melalui mekanisme seeding pada backend Yii2. Password akun dikonfigurasi melalui environment.

## 7. Pengujian API

File Postman tersedia pada folder `postman/`:

- `SIMRS.postman_collection.json`
- `SIMRS Local.postman_environment.json`

Import kedua file ke Postman, pilih environment **SIMRS Local**, kemudian jalankan request sesuai endpoint yang tersedia.

## 8. Dokumentasi

- `docs/Dokumentasi_SIMRS.pdf` — dokumentasi arsitektur, alur end-to-end, dan analisis skenario teknis.
- `database/ERD.png` — Entity Relationship Diagram.
- `database/schema.sql` — skema database PostgreSQL.

## 9. Catatan Keamanan

File `.env` tidak disertakan dalam repository karena dapat berisi kredensial dan secret. Gunakan `.env.example` sebagai template konfigurasi lokal.
