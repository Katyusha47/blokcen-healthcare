# BAB III  
# PERANCANGAN SISTEM

---

## 3.1 Deskripsi Sistem

### 3.1.1 Gambaran Umum Sistem

Sistem Healthcare Blockchain yang dirancang merupakan sebuah aplikasi berbasis web yang mengintegrasikan teknologi blockchain Hyperledger Fabric untuk manajemen rekam medis elektronik (Electronic Medical Records/EMR). Sistem ini bertujuan untuk mengatasi permasalahan keamanan, privasi, dan integritas data dalam pengelolaan informasi kesehatan pasien.

### 3.1.2 Tujuan Sistem

Sistem ini dirancang dengan tujuan utama:

1. **Keamanan Data**: Melindungi data rekam medis dari akses tidak sah menggunakan autentikasi berbasis JWT dan enkripsi.

2. **Integritas Data**: Memastikan data rekam medis tidak dapat diubah atau dimanipulasi melalui mekanisme hashing SHA-256 dan blockchain immutability.

3. **Audit Trail**: Menyediakan jejak audit yang transparan dan tidak dapat diubah untuk setiap akses dan modifikasi data rekam medis.

4. **Kontrol Akses Terdistribusi**: Memberikan pasien kendali penuh atas siapa yang dapat mengakses data medis mereka melalui sistem permission management.

5. **Transparansi**: Meningkatkan transparansi dalam pengelolaan data kesehatan melalui teknologi distributed ledger.

### 3.1.3 Ruang Lingkup Sistem

Sistem ini mencakup fungsionalitas berikut:

**A. Manajemen Pengguna**
- Registrasi dan autentikasi pengguna (dokter, pasien, admin)
- Role-based access control (RBAC)
- Manajemen profil pengguna

**B. Manajemen Rekam Medis**
- Pembuatan rekam medis baru oleh dokter
- Penyimpanan metadata di blockchain
- Penyimpanan data lengkap di database MySQL
- Verifikasi integritas data menggunakan hash

**C. Manajemen Permission**
- Pemberian izin akses oleh pasien kepada dokter
- Pencabutan izin akses
- Validasi izin sebelum akses data

**D. Audit Trail**
- Pencatatan setiap akses ke rekam medis
- Pencatatan setiap modifikasi data
- Query riwayat lengkap dari blockchain

**E. Verifikasi Data**
- Validasi hash untuk deteksi manipulasi data
- Query blockchain untuk verifikasi keaslian
- Tampilan status verifikasi pada interface

### 3.1.4 Aktor Sistem

Sistem ini melibatkan tiga jenis aktor utama:

**1. Dokter (Doctor)**
- Membuat rekam medis untuk pasien
- Melihat rekam medis pasien yang telah memberikan izin
- Mengupdate informasi rekam medis
- Melihat audit trail

**2. Pasien (Patient)**
- Melihat rekam medis pribadi
- Memberikan izin akses kepada dokter
- Mencabut izin akses
- Melihat riwayat akses ke data mereka
- Download rekam medis

**3. Administrator (Admin)**
- Mengelola pengguna sistem
- Monitoring aktivitas sistem
- Melihat statistik dan laporan
- Mengelola konfigurasi sistem

### 3.1.5 Teknologi yang Digunakan

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5 untuk UI framework
- Fetch API untuk komunikasi dengan backend

**Backend:**
- Node.js v22.x sebagai runtime environment
- Express.js sebagai web framework
- MySQL sebagai relational database
- JWT untuk autentikasi
- Bcrypt untuk password hashing
- SHA-256 untuk data integrity hashing

**Blockchain Platform:**
- Hyperledger Fabric v2.5.0
- Node.js Chaincode (Smart Contract)
- Fabric SDK for Node.js v2.2.20
- Fabric CA (Certificate Authority) v1.5.5
- CouchDB sebagai state database

**Development Tools:**
- Visual Studio Code - IDE untuk coding
- Ubuntu 22.04 LTS (Virtual Machine) - Environment development blockchain
- VirtualBox - Virtualisasi untuk menjalankan Ubuntu
- Docker & Docker Compose - Containerization untuk Fabric network
- Git - Version control
- MySQL Workbench - Database management
- Postman - API testing (optional)
- Terminal/PowerShell - Command line interface

**Package Manager:**
- npm (Node Package Manager) - Dependency management
- nodemon - Auto-restart development server

**Testing Tools:**
- curl - Command line HTTP testing
- Browser Developer Tools - Frontend debugging

---

## 3.2 Arsitektur Sistem

### 3.2.1 Arsitektur Keseluruhan

Sistem healthcare blockchain ini mengimplementasikan arsitektur tiga lapis (three-tier architecture) yang terintegrasi dengan blockchain layer:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Presentation)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Doctor     │    │   Patient    │    │    Admin     │                  │
│  │  Dashboard   │    │  Dashboard   │    │  Dashboard   │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                    │                           │
│         └───────────────────┴────────────────────┘                           │
│                             │                                                │
│                    ┌────────▼────────┐                                       │
│                    │  Web Browser    │                                       │
│                    │  (localhost:3000)│                                      │
│                    │  HTML/CSS/JS    │                                       │
│                    └────────┬────────┘                                       │
│                             │                                                │
└─────────────────────────────┼────────────────────────────────────────────────┘
                              │ HTTP/HTTPS
                              │ REST API (JSON)
┌─────────────────────────────▼────────────────────────────────────────────────┐
│                      APPLICATION LAYER (Business Logic)                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────┐          │
│  │              Node.js Express Server (Port 3000)               │          │
│  ├───────────────────────────────────────────────────────────────┤          │
│  │                        API Routes                              │          │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │          │
│  │  │ /api/auth    │  │/api/records  │  │ /api/audit   │       │          │
│  │  │              │  │              │  │              │       │          │
│  │  │ • login      │  │ • create     │  │ • getTrail   │       │          │
│  │  │ • register   │  │ • read       │  │ • getAccess  │       │          │
│  │  │ • logout     │  │ • update     │  │              │       │          │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │          │
│  │         │                 │                  │                │          │
│  │         └─────────────────┴──────────────────┘                │          │
│  │                           │                                   │          │
│  │  ┌────────────────────────▼─────────────────────────┐        │          │
│  │  │           Controllers Layer                      │        │          │
│  │  │  • Authentication Logic                          │        │          │
│  │  │  • Business Rules                                │        │          │
│  │  │  • Data Validation                               │        │          │
│  │  └────────┬──────────────────────────┬─────────────┘        │          │
│  │           │                          │                       │          │
│  └───────────┼──────────────────────────┼───────────────────────┘          │
│              │                          │                                   │
│     ┌────────▼────────┐        ┌───────▼──────────┐                       │
│     │  MySQL Database │        │  Fabric SDK      │                       │
│     │  (Port 3306)    │        │  Integration     │                       │
│     │                 │        │                  │                       │
│     │ Tables:         │        │ • Gateway        │                       │
│     │ • users         │        │ • Wallet         │                       │
│     │ • medical_records│       │ • Contract       │                       │
│     │ • permissions   │        │ • Identity       │                       │
│     │ • access_logs   │        └───────┬──────────┘                       │
│     └─────────────────┘                │                                   │
│                                        │ gRPC over TLS                     │
└────────────────────────────────────────┼───────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼───────────────────────────────────┐
│                    BLOCKCHAIN LAYER (Data Integrity)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Smart Contract Layer                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │      Healthcare Chaincode (medicalRecords.js)                       │   │
│  │                                                                       │   │
│  │  Functions:                                                          │   │
│  │  • initLedger()                  • recordAccess()                   │   │
│  │  • createMedicalRecord()         • queryRecordsByPatient()          │   │
│  │  • queryMedicalRecord()          • queryRecordsByDoctor()           │   │
│  │  • getRecordHistory()            • queryAllMedicalRecords()         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Consensus Layer                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │            Orderer (orderer.example.com:7050)                        │   │
│  │            • Transaction Ordering                                    │   │
│  │            • Block Creation                                          │   │
│  │            • Raft Consensus                                          │   │
│  └────────────────────────┬─────────────────────────────────────────────┘   │
│                           │                                                 │
│              ┌────────────┴────────────┐                                   │
│              │                         │                                   │
│  ┌───────────▼──────────┐  ┌──────────▼───────────┐                       │
│  │  Organization 1      │  │  Organization 2      │                       │
│  │  (Hospital A)        │  │  (Hospital B)        │                       │
│  │  Org1MSP             │  │  Org2MSP             │                       │
│  ├──────────────────────┤  ├──────────────────────┤                       │
│  │                      │  │                      │                       │
│  │ Peer0.Org1:7051     │  │ Peer0.Org2:9051     │                       │
│  │ • Endorsement       │  │ • Endorsement       │                       │
│  │ • Validation        │  │ • Validation        │                       │
│  │ • Ledger Storage    │  │ • Ledger Storage    │                       │
│  │                      │  │                      │                       │
│  │ CouchDB:5984        │  │ CouchDB:6984        │                       │
│  │ (World State)       │  │ (World State)       │                       │
│  │                      │  │                      │                       │
│  │ CA:7054             │  │ CA:8054             │                       │
│  │ (Certificate Auth)  │  │ (Certificate Auth)  │                       │
│  └──────────────────────┘  └──────────────────────┘                       │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 3.2.2 Komponen Utama Sistem

**A. Client Layer**

Lapisan presentasi yang berinteraksi langsung dengan pengguna melalui web browser. Komponen ini bertanggung jawab untuk:
- Rendering user interface
- Validasi input client-side
- Mengirim request ke server melalui REST API
- Menampilkan response dari server

**B. Application Layer**

Lapisan logika bisnis yang terdiri dari:

1. **Express.js Server**: Web server yang menangani HTTP requests
2. **Routes**: Endpoint API untuk berbagai operasi
3. **Controllers**: Implementasi logika bisnis
4. **Middleware**: Authentication, authorization, validation
5. **Database Connection**: Koneksi ke MySQL
6. **Fabric SDK**: Integrasi dengan blockchain network

**C. Data Layer**

Terdiri dari dua komponen penyimpanan data:

1. **MySQL Database**: 
   - Menyimpan data lengkap rekam medis
   - Menyimpan informasi pengguna
   - Menyimpan permission dan access logs
   - Mendukung query kompleks

2. **Hyperledger Fabric Ledger**:
   - Menyimpan metadata rekam medis
   - Menyimpan hash untuk verifikasi integritas
   - Menyimpan audit trail immutable
   - Mendukung smart contract execution

**D. Blockchain Layer**

Terdiri dari komponen Hyperledger Fabric:

1. **Smart Contract (Chaincode)**: Logika bisnis di blockchain
2. **Peers**: Node yang menyimpan ledger dan execute chaincode
3. **Orderer**: Node yang mengurutkan transaksi
4. **Certificate Authority**: Mengelola identitas dan sertifikat
5. **World State Database**: CouchDB untuk state management

### 3.2.3 Alur Komunikasi Data

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Data Flow - Create Medical Record                      │
└──────────────────────────────────────────────────────────────────────────┘

Client                API Server           MySQL DB        Fabric Network
  │                       │                    │                  │
  │ 1. POST /api/records  │                    │                  │
  ├──────────────────────►│                    │                  │
  │                       │                    │                  │
  │                       │ 2. Validate Data   │                  │
  │                       │ 3. Check Permission│                  │
  │                       │                    │                  │
  │                       │ 4. INSERT record   │                  │
  │                       ├───────────────────►│                  │
  │                       │◄───────────────────┤                  │
  │                       │   recordId: 123    │                  │
  │                       │                    │                  │
  │                       │ 5. Calculate Hash  │                  │
  │                       │    SHA256(data)    │                  │
  │                       │                    │                  │
  │                       │ 6. Submit to Blockchain              │
  │                       │    createMedicalRecord()             │
  │                       ├─────────────────────────────────────►│
  │                       │                    │                  │
  │                       │                    │  7. Endorse (Org1)
  │                       │                    │  8. Endorse (Org2)
  │                       │                    │  9. Order Block
  │                       │                    │ 10. Validate
  │                       │                    │ 11. Commit
  │                       │                    │                  │
  │                       │ 12. Transaction ID │                  │
  │                       │◄─────────────────────────────────────┤
  │                       │    txId: 0xabc...  │                  │
  │                       │                    │                  │
  │                       │ 13. UPDATE txId    │                  │
  │                       ├───────────────────►│                  │
  │                       │                    │                  │
  │ 14. Response          │                    │                  │
  │◄──────────────────────┤                    │                  │
  │   {success: true,     │                    │                  │
  │    recordId: 123,     │                    │                  │
  │    txId: 0xabc...}    │                    │                  │
  │                       │                    │                  │
```

---

## 3.3 Diagram Use Case / Flowchart

### 3.3.1 Use Case Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│              Healthcare Blockchain System - Use Case Diagram            │
└────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────────┐
                              │                         │
        ┌─────────────────────┤  Healthcare Blockchain  │──────────────────┐
        │                     │        System           │                  │
        │                     │                         │                  │
        │                     └─────────────────────────┘                  │
        │                                                                   │
        │                                                                   │
 ┌──────▼──────┐                                                   ┌───────▼──────┐
 │             │                                                   │              │
 │   Doctor    │                                                   │   Patient    │
 │             │                                                   │              │
 └──────┬──────┘                                                   └───────┬──────┘
        │                                                                  │
        │                                                                  │
        │ • Login/Logout                                                   │
        │ • Create Medical Record ──────────────┐                         │
        │ • View Patient Records                │                         │
        │ • Update Record                       │  ┌──────────────────────┤
        │ • View Audit Trail                    │  │ • Login/Logout       │
        │ • Generate Report                     │  │ • View Own Records   │
        │                                       │  │ • Grant Permission   │
        └───────────────────┬───────────────────┘  │ • Revoke Permission  │
                            │                      │ • View Access History│
                            │                      │ • Download Records   │
                            │                      │                      │
                            │                      └──────────┬───────────┘
                            │                                 │
                            │         ┌───────────────────────┤
                            │         │                       │
                            │         │                       │
                     ┌──────▼─────────▼──────┐               │
                     │                        │               │
                     │  Blockchain Network    │◄──────────────┘
                     │  (Hyperledger Fabric)  │
                     │                        │
                     │  • Store Metadata      │
                     │  • Maintain Audit Trail│
                     │  • Execute Smart       │
                     │    Contract            │
                     │  • Validate Integrity  │
                     │  • Consensus           │
                     │                        │
                     └────────────────────────┘
                                 ▲
                                 │
                                 │
                          ┌──────┴──────┐
                          │             │
                          │    Admin    │
                          │             │
                          └──────┬──────┘
                                 │
                                 │
                                 │ • User Management
                                 │ • System Monitoring
                                 │ • View Statistics
                                 │ • System Configuration
                                 │ • Backup/Restore
                                 │
```

### 3.3.2 Activity Diagram - Pembuatan Rekam Medis

```
┌────────────────────────────────────────────────────────────────────────┐
│          Activity Diagram: Create Medical Record Process               │
└────────────────────────────────────────────────────────────────────────┘

Doctor                  System                MySQL          Blockchain
  │                       │                      │                │
  │                       │                      │                │
  ● Start                 │                      │                │
  │                       │                      │                │
  ▼                       │                      │                │
┌───────────────┐         │                      │                │
│ Login to      │         │                      │                │
│ System        ├────────►│                      │                │
└───────────────┘         │                      │                │
                          ▼                      │                │
                    ┌──────────┐                 │                │
                    │ Verify   │                 │                │
                    │ Identity │                 │                │
                    └────┬─────┘                 │                │
                         │                       │                │
                    [Valid?]                     │                │
                    No   │   Yes                 │                │
              ┌──────────┴──────────┐            │                │
              │                     │            │                │
              ▼                     ▼            │                │
        ┌──────────┐          ┌──────────┐      │                │
        │  Reject  │          │  Grant   │      │                │
        │  Access  │          │  Access  │      │                │
        └────┬─────┘          └────┬─────┘      │                │
             │                     │            │                │
             ● End                 │            │                │
                                   │            │                │
  ┌──────────────────────────────┐ │            │                │
  │ Navigate to Create Record    │◄┘            │                │
  │ Page                         │              │                │
  └──────┬───────────────────────┘              │                │
         │                                      │                │
         ▼                                      │                │
  ┌──────────────────┐                          │                │
  │ Select Patient   │                          │                │
  └──────┬───────────┘                          │                │
         │                                      │                │
         ▼                                      │                │
  ┌──────────────────┐                          │                │
  │ Fill Form:       │                          │                │
  │ • Diagnosis      │                          │                │
  │ • Treatment      │                          │                │
  │ • Medication     │                          │                │
  │ • Notes          │                          │                │
  └──────┬───────────┘                          │                │
         │                                      │                │
         ▼                                      │                │
  ┌──────────────────┐                          │                │
  │ Click Submit     ├─────────────────────────►│                │
  └──────────────────┘                          │                │
                                                ▼                │
                                          ┌──────────┐           │
                                          │ Validate │           │
                                          │ Data     │           │
                                          └────┬─────┘           │
                                               │                 │
                                          [Valid?]               │
                                          No   │   Yes           │
                                    ┌──────────┴────────┐        │
                                    │                   │        │
                                    ▼                   ▼        │
                              ┌──────────┐      ┌─────────────┐ │
                              │  Return  │      │ Check       │ │
                              │  Error   │      │ Permission  │ │
                              └────┬─────┘      └──────┬──────┘ │
                                   │                   │        │
                                   └────────┬──────────┘        │
                                            │ [Authorized?]     │
                                       No   │   Yes             │
                                  ┌─────────┴─────────┐         │
                                  │                   │         │
                                  ▼                   ▼         │
                            ┌──────────┐     ┌──────────────┐  │
                            │  Reject  │     │ Calculate    │  │
                            │  Request │     │ Data Hash    │  │
                            └────┬─────┘     │ (SHA-256)    │  │
                                 │           └──────┬───────┘  │
                                 │                  │          │
                                 │                  ▼          │
                                 │           ┌──────────────┐  │
                                 │           │ Insert to    │  │
                                 │           │ MySQL DB     ├─►│
                                 │           └──────┬───────┘  │
                                 │                  │          │
                                 │                  ▼          │
                                 │           ┌──────────────┐  │
                                 │           │ Submit to    │  │
                                 │           │ Blockchain   ├──┼─►│
                                 │           └──────┬───────┘  │  │
                                 │                  │          │  │
                                 │                  │  ◄───────┼──┘
                                 │                  │ txId     │
                                 │                  │          │
                                 │                  ▼          │
                                 │           ┌──────────────┐  │
                                 │           │ Update DB    │  │
                                 │           │ with txId    ├─►│
                                 │           └──────┬───────┘  │
                                 │                  │          │
  ┌──────────────────────────────┴──────────────────┘          │
  │                                                             │
  ▼                                                             │
┌───────────────┐                                               │
│ Show Success  │                                               │
│ Message +     │                                               │
│ Record ID     │                                               │
└───────┬───────┘                                               │
        │                                                       │
        ▼                                                       │
  ┌──────────────┐                                              │
  │ View Record  │                                              │
  │ Details      │                                              │
  └──────┬───────┘                                              │
         │                                                      │
         ● End                                                  │
```

### 3.3.3 Flowchart - Verifikasi Integritas Data

```
┌────────────────────────────────────────────────────────────────────────┐
│            Flowchart: Data Integrity Verification Process              │
└────────────────────────────────────────────────────────────────────────┘

                              ● START
                                │
                                ▼
                    ┌───────────────────────┐
                    │ User Requests Record  │
                    │ View/Access           │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Retrieve Record from  │
                    │ MySQL Database        │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Calculate Current     │
                    │ Hash of Record Data   │
                    │ hash = SHA256(data)   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Query Blockchain for  │
                    │ Original Hash         │
                    │ (using record ID)     │
                    └───────────┬───────────┘
                                │
                                ▼
                       ┌────────────────┐
                       │ Compare Hashes │
                       └────────┬───────┘
                                │
                 ┌──────────────┴───────────────┐
                 │                              │
            [Match?]                       [No Match?]
                 │                              │
                 ▼                              ▼
    ┌───────────────────────┐      ┌───────────────────────┐
    │ Hash Status: VALID    │      │ Hash Status: INVALID  │
    │ ✓ Data Not Tampered   │      │ ✗ Data May Be         │
    │                       │      │   Tampered            │
    └───────────┬───────────┘      └───────────┬───────────┘
                │                              │
                ▼                              ▼
    ┌───────────────────────┐      ┌───────────────────────┐
    │ Display Record with   │      │ Display Warning       │
    │ Green Badge: "Valid"  │      │ Red Badge: "Invalid"  │
    └───────────┬───────────┘      └───────────┬───────────┘
                │                              │
                └──────────────┬───────────────┘
                               │
                               ▼
                    ┌───────────────────────┐
                    │ Check Blockchain TX   │
                    │ Status                │
                    └───────────┬───────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
           [TX Exists?]                  [No TX Found?]
                 │                             │
                 ▼                             ▼
    ┌───────────────────────┐      ┌───────────────────────┐
    │ Show Transaction ID   │      │ Show "Pending" Status │
    │ Allow View Audit Trail│      │ Blockchain sync may   │
    │                       │      │ be in progress        │
    └───────────┬───────────┘      └───────────┬───────────┘
                │                              │
                └──────────────┬───────────────┘
                               │
                               ▼
                    ┌───────────────────────┐
                    │ Log Access Event      │
                    │ to Blockchain         │
                    │ (recordAccess)        │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Display Complete      │
                    │ Record Information    │
                    └───────────┬───────────┘
                                │
                                ▼
                              ● END
```

### 3.3.4 Sequence Diagram - Grant Permission

```
┌────────────────────────────────────────────────────────────────────────┐
│          Sequence Diagram: Grant Access Permission Process             │
└────────────────────────────────────────────────────────────────────────┘

Patient     Web UI      API Server    MySQL DB    Blockchain
  │           │             │             │            │
  │           │             │             │            │
  ├─ Login ──►│             │             │            │
  │           ├─ POST /auth─►│             │            │
  │           │             ├─ Verify ───►│            │
  │           │             │             │            │
  │◄─ Token ──┤◄─ JWT ──────┤             │            │
  │           │             │             │            │
  │           │             │             │            │
  ├─ View ───►│             │             │            │
  │  Doctors  │             │             │            │
  │           ├─ GET /doctors─►           │            │
  │           │             ├─ Query ────►│            │
  │           │             │             │            │
  │◄─ List ───┤◄─ Doctors ──┤◄─ Result ──┤            │
  │           │             │             │            │
  │           │             │             │            │
  ├─ Select ─►│             │             │            │
  │  Doctor   │             │             │            │
  │           │             │             │            │
  ├─ Grant ──►│             │             │            │
  │  Access   │             │             │            │
  │           ├─ POST /permissions──────►│             │
  │           │             │             │            │
  │           │             ├─ Validate ─►│            │
  │           │             │  Patient &  │            │
  │           │             │  Doctor IDs │            │
  │           │             │             │            │
  │           │             ├─ Check ────►│            │
  │           │             │  Existing   │            │
  │           │             │  Permission │            │
  │           │             │             │            │
  │           │             │◄─ Not Found─┤            │
  │           │             │             │            │
  │           │             ├─ INSERT ───►│            │
  │           │             │  permission │            │
  │           │             │             │            │
  │           │             │◄─ Success ──┤            │
  │           │             │             │            │
  │           │             ├─ Submit TX ─────────────►│
  │           │             │  recordAccess()          │
  │           │             │  {                       │
  │           │             │   action: "grant",       │
  │           │             │   patientId: 1,          │
  │           │             │   doctorId: 2            │
  │           │             │  }                       │
  │           │             │             │            │
  │           │             │             │ Endorse ►  │
  │           │             │             │ Order ►    │
  │           │             │             │ Validate ► │
  │           │             │             │ Commit ►   │
  │           │             │             │            │
  │           │             │◄─ TX ID ────────────────┤
  │           │             │  0xabc123...             │
  │           │             │             │            │
  │           │◄─ Success ──┤             │            │
  │◄─ Confirm─┤  {success: true,          │            │
  │           │   txId: "0xabc..."}       │            │
  │           │             │             │            │
  │           │             │             │            │
  └───────────┴─────────────┴─────────────┴────────────┘
```

---

## 3.4 Perancangan Smart Contract

### 3.4.1 Struktur Smart Contract

Smart contract dalam sistem ini diimplementasikan menggunakan Node.js chaincode untuk Hyperledger Fabric. Smart contract bernama `MedicalRecordsContract` mewarisi dari `Contract` class yang disediakan oleh Fabric Contract API.

**Struktur File:**
```
fabric-network/chaincode/
├── medicalRecords.js     # Smart contract implementation
├── package.json          # Dependencies dan metadata
└── node_modules/         # Required packages
```

### 3.4.2 Fungsi-Fungsi Utama Smart Contract

Smart contract terdiri dari 8 fungsi utama yaitu:

**1. initLedger()**
- Inisialisasi ledger dengan data sampel
- Dipanggil saat deployment pertama kali
- Membuat beberapa record contoh untuk testing

**2. createMedicalRecord()**
- Membuat record medis baru di blockchain
- Menyimpan metadata dan hash
- Mengembalikan record yang telah dibuat

**3. queryMedicalRecord()**
- Query record berdasarkan recordId
- Mengembalikan detail record
- Read-only operation

**4. getRecordHistory()**
- Mengambil seluruh history transaksi untuk satu record
- Menampilkan audit trail lengkap
- Menunjukkan semua perubahan yang pernah terjadi

**5. recordAccess()**
- Mencatat event akses ke record
- Logging untuk audit trail
- Menyimpan informasi siapa mengakses kapan

**6. queryRecordsByPatient()**
- Query semua record milik satu pasien
- Filter berdasarkan patientId
- Rich query menggunakan CouchDB

**7. queryRecordsByDoctor()**
- Query semua record yang dibuat oleh satu dokter
- Filter berdasarkan doctorId
- Rich query menggunakan CouchDB

**8. queryAllMedicalRecords()**
- Mengambil semua record di ledger
- Untuk keperluan admin/monitoring
- Pagination dapat ditambahkan

### 3.4.3 Pseudocode Smart Contract

```
CONTRACT MedicalRecordsContract EXTENDS Contract

    // ========================================
    // Function 1: Initialize Ledger
    // ========================================
    FUNCTION initLedger(ctx)
        BEGIN
            INFO "Starting ledger initialization"
            
            // Define sample records
            records = [
                {
                    recordId: "REC001",
                    patientId: "1",
                    doctorId: "2",
                    recordHash: "sample_hash_1",
                    timestamp: CURRENT_TIMESTAMP,
                    docType: "medicalRecord"
                },
                // ... more sample records
            ]
            
            // Store each record in ledger
            FOR EACH record IN records DO
                key = "RECORD_" + record.recordId
                CALL ctx.stub.putState(key, SERIALIZE(record))
                INFO "Added record: " + record.recordId
            END FOR
            
            INFO "Ledger initialized successfully"
        END
    
    // ========================================
    // Function 2: Create Medical Record
    // ========================================
    FUNCTION createMedicalRecord(ctx, recordData)
        BEGIN
            INFO "Creating new medical record"
            
            // Parse input JSON
            record = PARSE_JSON(recordData)
            
            // Validate required fields
            IF record.recordId IS EMPTY THEN
                THROW ERROR "recordId is required"
            END IF
            
            IF record.patientId IS EMPTY THEN
                THROW ERROR "patientId is required"
            END IF
            
            IF record.doctorId IS EMPTY THEN
                THROW ERROR "doctorId is required"
            END IF
            
            IF record.recordHash IS EMPTY THEN
                THROW ERROR "recordHash is required"
            END IF
            
            // Generate composite key
            recordKey = "RECORD_" + record.recordId
            
            // Check if record already exists
            existingRecord = CALL ctx.stub.getState(recordKey)
            IF existingRecord IS NOT EMPTY THEN
                THROW ERROR "Record with ID " + record.recordId + " already exists"
            END IF
            
            // Add metadata
            record.docType = "medicalRecord"
            record.createdAt = CURRENT_TIMESTAMP
            record.updatedAt = CURRENT_TIMESTAMP
            
            // Store record in ledger
            CALL ctx.stub.putState(recordKey, SERIALIZE(record))
            
            INFO "Medical record created: " + record.recordId
            
            // Return created record
            RETURN SERIALIZE(record)
        END
    
    // ========================================
    // Function 3: Query Medical Record
    // ========================================
    FUNCTION queryMedicalRecord(ctx, recordId)
        BEGIN
            INFO "Querying record: " + recordId
            
            // Validate input
            IF recordId IS EMPTY THEN
                THROW ERROR "recordId parameter is required"
            END IF
            
            // Generate key
            recordKey = "RECORD_" + recordId
            
            // Retrieve from ledger
            recordBytes = CALL ctx.stub.getState(recordKey)
            
            // Check if exists
            IF recordBytes IS EMPTY OR recordBytes.length == 0 THEN
                THROW ERROR "Medical record " + recordId + " does not exist"
            END IF
            
            // Parse and return
            record = DESERIALIZE(recordBytes)
            RETURN SERIALIZE(record)
        END
    
    // ========================================
    // Function 4: Get Record History
    // ========================================
    FUNCTION getRecordHistory(ctx, recordId)
        BEGIN
            INFO "Retrieving history for record: " + recordId
            
            // Validate input
            IF recordId IS EMPTY THEN
                THROW ERROR "recordId is required"
            END IF
            
            // Generate key
            recordKey = "RECORD_" + recordId
            
            // Get history iterator
            historyIterator = CALL ctx.stub.getHistoryForKey(recordKey)
            
            // Initialize result array
            history = []
            
            // Iterate through history
            WHILE historyIterator.hasNext() DO
                modification = historyIterator.next()
                
                // Create history entry
                historyEntry = {
                    txId: modification.txId,
                    timestamp: CONVERT_TO_DATE(modification.timestamp),
                    isDelete: modification.isDelete,
                    value: null
                }
                
                // Add value if not deleted
                IF NOT modification.isDelete THEN
                    historyEntry.value = DESERIALIZE(modification.value)
                END IF
                
                // Add to history array
                history.APPEND(historyEntry)
            END WHILE
            
            // Close iterator
            CALL historyIterator.close()
            
            INFO "Retrieved " + history.length + " history entries"
            
            // Return history
            RETURN SERIALIZE(history)
        END
    
    // ========================================
    // Function 5: Record Access Event
    // ========================================
    FUNCTION recordAccess(ctx, accessData)
        BEGIN
            INFO "Recording access event"
            
            // Parse input
            access = PARSE_JSON(accessData)
            
            // Validate
            IF access.recordId IS EMPTY THEN
                THROW ERROR "recordId is required"
            END IF
            
            IF access.userId IS EMPTY THEN
                THROW ERROR "userId is required"
            END IF
            
            // Generate unique access key
            accessKey = "ACCESS_" + GENERATE_UUID()
            
            // Add metadata
            access.docType = "accessLog"
            access.timestamp = CURRENT_TIMESTAMP
            access.txId = ctx.stub.getTxID()
            
            // Store access log
            CALL ctx.stub.putState(accessKey, SERIALIZE(access))
            
            INFO "Access recorded: " + accessKey
            
            RETURN SERIALIZE(access)
        END
    
    // ========================================
    // Function 6: Query Records by Patient
    // ========================================
    FUNCTION queryRecordsByPatient(ctx, patientId)
        BEGIN
            INFO "Querying records for patient: " + patientId
            
            // Validate input
            IF patientId IS EMPTY THEN
                THROW ERROR "patientId is required"
            END IF
            
            // Build CouchDB query
            queryString = {
                selector: {
                    docType: "medicalRecord",
                    patientId: patientId
                },
                sort: [
                    {createdAt: "desc"}
                ]
            }
            
            // Execute query
            iterator = CALL ctx.stub.getQueryResult(SERIALIZE(queryString))
            
            // Collect results
            results = []
            WHILE iterator.hasNext() DO
                result = iterator.next()
                record = DESERIALIZE(result.value)
                results.APPEND(record)
            END WHILE
            
            // Close iterator
            CALL iterator.close()
            
            INFO "Found " + results.length + " records for patient"
            
            RETURN SERIALIZE(results)
        END
    
    // ========================================
    // Function 7: Query Records by Doctor
    // ========================================
    FUNCTION queryRecordsByDoctor(ctx, doctorId)
        BEGIN
            INFO "Querying records created by doctor: " + doctorId
            
            // Validate input
            IF doctorId IS EMPTY THEN
                THROW ERROR "doctorId is required"
            END IF
            
            // Build CouchDB query
            queryString = {
                selector: {
                    docType: "medicalRecord",
                    doctorId: doctorId
                },
                sort: [
                    {createdAt: "desc"}
                ]
            }
            
            // Execute query
            iterator = CALL ctx.stub.getQueryResult(SERIALIZE(queryString))
            
            // Collect results
            results = []
            WHILE iterator.hasNext() DO
                result = iterator.next()
                record = DESERIALIZE(result.value)
                results.APPEND(record)
            END WHILE
            
            // Close iterator
            CALL iterator.close()
            
            INFO "Found " + results.length + " records by doctor"
            
            RETURN SERIALIZE(results)
        END
    
    // ========================================
    // Function 8: Query All Medical Records
    // ========================================
    FUNCTION queryAllMedicalRecords(ctx)
        BEGIN
            INFO "Querying all medical records"
            
            // Build query for all medical records
            queryString = {
                selector: {
                    docType: "medicalRecord"
                }
            }
            
            // Execute query
            iterator = CALL ctx.stub.getQueryResult(SERIALIZE(queryString))
            
            // Collect all results
            allRecords = []
            WHILE iterator.hasNext() DO
                result = iterator.next()
                record = DESERIALIZE(result.value)
                allRecords.APPEND(record)
            END WHILE
            
            // Close iterator
            CALL iterator.close()
            
            INFO "Total records found: " + allRecords.length
            
            RETURN SERIALIZE(allRecords)
        END

END CONTRACT
```

### 3.4.4 Implementasi Kode Smart Contract (JavaScript)

```javascript
'use strict';

const { Contract } = require('fabric-contract-api');

class MedicalRecordsContract extends Contract {

    // Initialize ledger with sample data
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        
        const records = [
            {
                recordId: 'REC001',
                patientId: '1',
                doctorId: '2',
                recordHash: 'abc123hash',
                timestamp: '2025-01-01T10:00:00Z',
                action: 'create'
            },
            {
                recordId: 'REC002',
                patientId: '2',
                doctorId: '2',
                recordHash: 'def456hash',
                timestamp: '2025-01-02T11:00:00Z',
                action: 'create'
            }
        ];

        for (let i = 0; i < records.length; i++) {
            records[i].docType = 'medicalRecord';
            const recordKey = `RECORD_${records[i].recordId}`;
            await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(records[i])));
            console.info(`Added medical record: ${records[i].recordId}`);
        }
        
        console.info('============= END : Initialize Ledger ===========');
    }

    // Create a new medical record
    async createMedicalRecord(ctx, recordData) {
        console.info('============= START : Create Medical Record ===========');
        
        // Parse input data
        const record = JSON.parse(recordData);
        
        // Validate required fields
        if (!record.recordId || !record.patientId || !record.doctorId) {
            throw new Error('Missing required fields: recordId, patientId, doctorId');
        }
        
        if (!record.recordHash) {
            throw new Error('recordHash is required for data integrity');
        }

        // Generate composite key
        const recordKey = `RECORD_${record.recordId}`;
        
        // Check if record already exists
        const existingRecord = await ctx.stub.getState(recordKey);
        if (existingRecord && existingRecord.length > 0) {
            throw new Error(`Record ${record.recordId} already exists`);
        }

        // Add metadata
        record.docType = 'medicalRecord';
        record.createdAt = new Date().toISOString();
        record.updatedAt = new Date().toISOString();

        // Store record in ledger
        await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(record)));
        
        console.info('============= END : Create Medical Record ===========');
        return JSON.stringify(record);
    }

    // Query a single medical record
    async queryMedicalRecord(ctx, recordId) {
        console.info('============= START : Query Medical Record ===========');
        
        if (!recordId) {
            throw new Error('recordId parameter is required');
        }

        const recordKey = `RECORD_${recordId}`;
        const recordBytes = await ctx.stub.getState(recordKey);
        
        if (!recordBytes || recordBytes.length === 0) {
            throw new Error(`Medical record ${recordId} does not exist`);
        }
        
        const record = JSON.parse(recordBytes.toString());
        console.info('============= END : Query Medical Record ===========');
        return JSON.stringify(record);
    }

    // Get complete history of a medical record
    async getRecordHistory(ctx, recordId) {
        console.info('============= START : Get Record History ===========');
        
        if (!recordId) {
            throw new Error('recordId is required');
        }

        const recordKey = `RECORD_${recordId}`;
        const historyIterator = await ctx.stub.getHistoryForKey(recordKey);
        
        const history = [];
        let result = await historyIterator.next();
        
        while (!result.done) {
            const modification = {
                txId: result.value.txId,
                timestamp: new Date(result.value.timestamp.seconds.low * 1000).toISOString(),
                isDelete: result.value.isDelete,
                value: null
            };
            
            if (!result.value.isDelete) {
                modification.value = JSON.parse(result.value.value.toString('utf8'));
            }
            
            history.push(modification);
            result = await historyIterator.next();
        }
        
        await historyIterator.close();
        
        console.info('============= END : Get Record History ===========');
        return JSON.stringify(history);
    }

    // Record an access event
    async recordAccess(ctx, accessData) {
        console.info('============= START : Record Access ===========');
        
        const access = JSON.parse(accessData);
        
        if (!access.recordId || !access.userId) {
            throw new Error('recordId and userId are required');
        }

        // Generate unique key for access log
        const accessKey = `ACCESS_${ctx.stub.getTxID()}`;
        
        access.docType = 'accessLog';
        access.timestamp = new Date().toISOString();
        access.txId = ctx.stub.getTxID();

        await ctx.stub.putState(accessKey, Buffer.from(JSON.stringify(access)));
        
        console.info('============= END : Record Access ===========');
        return JSON.stringify(access);
    }

    // Query records by patient ID
    async queryRecordsByPatient(ctx, patientId) {
        console.info('============= START : Query Records By Patient ===========');
        
        if (!patientId) {
            throw new Error('patientId is required');
        }

        const queryString = {
            selector: {
                docType: 'medicalRecord',
                patientId: patientId
            },
            sort: [{ createdAt: 'desc' }]
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        console.info('============= END : Query Records By Patient ===========');
        return JSON.stringify(results);
    }

    // Query records by doctor ID
    async queryRecordsByDoctor(ctx, doctorId) {
        console.info('============= START : Query Records By Doctor ===========');
        
        if (!doctorId) {
            throw new Error('doctorId is required');
        }

        const queryString = {
            selector: {
                docType: 'medicalRecord',
                doctorId: doctorId
            },
            sort: [{ createdAt: 'desc' }]
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        console.info('============= END : Query Records By Doctor ===========');
        return JSON.stringify(results);
    }

    // Query all medical records
    async queryAllMedicalRecords(ctx) {
        console.info('============= START : Query All Records ===========');
        
        const queryString = {
            selector: {
                docType: 'medicalRecord'
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        console.info('============= END : Query All Records ===========');
        return JSON.stringify(results);
    }

    // Helper function to get all results from iterator
    async _getAllResults(iterator) {
        const allResults = [];
        let result = await iterator.next();
        
        while (!result.done) {
            const record = JSON.parse(result.value.value.toString('utf8'));
            allResults.push(record);
            result = await iterator.next();
        }
        
        await iterator.close();
        return allResults;
    }
}

module.exports = MedicalRecordsContract;
```

### 3.4.5 Data Model Smart Contract

```javascript
// Medical Record Model
{
    recordId: String,         // Unique identifier (e.g., "REC001")
    patientId: String,        // Foreign key to patient
    doctorId: String,         // Foreign key to doctor
    recordHash: String,       // SHA-256 hash for integrity
    timestamp: String,        // ISO 8601 timestamp
    action: String,           // "create", "update", "access"
    docType: String,          // "medicalRecord" (for queries)
    createdAt: String,        // Creation timestamp
    updatedAt: String,        // Last update timestamp
    txId: String             // Blockchain transaction ID
}

// Access Log Model
{
    recordId: String,         // Record being accessed
    userId: String,           // User who accessed
    action: String,           // "view", "grant", "revoke"
    timestamp: String,        // When accessed
    docType: String,          // "accessLog"
    txId: String             // Transaction ID
}
```

### 3.4.6 Endorsement Policy

Smart contract ini menggunakan endorsement policy yang mengharuskan approval dari kedua organisasi:

```
Endorsement Policy: AND('Org1MSP.peer', 'Org2MSP.peer')
```

Artinya:
- Transaksi harus di-endorse oleh peer dari Org1 **DAN** Org2
- Kedua organisasi harus menyetujui transaksi
- Consensus dicapai setelah validasi oleh kedua pihak

### 3.4.7 Deployment Smart Contract

```bash
# 1. Package chaincode
peer lifecycle chaincode package healthcare.tar.gz \
  --path ../chaincode/healthcare \
  --lang node \
  --label healthcare_1.0

# 2. Install on Org1 peer
peer lifecycle chaincode install healthcare.tar.gz

# 3. Install on Org2 peer
peer lifecycle chaincode install healthcare.tar.gz

# 4. Approve for Org1
peer lifecycle chaincode approveformyorg \
  --channelID healthcarechannel \
  --name healthcare \
  --version 1.0 \
  --package-id $CC_PACKAGE_ID \
  --sequence 1

# 5. Approve for Org2
peer lifecycle chaincode approveformyorg \
  --channelID healthcarechannel \
  --name healthcare \
  --version 1.0 \
  --package-id $CC_PACKAGE_ID \
  --sequence 1

# 6. Commit chaincode definition
peer lifecycle chaincode commit \
  --channelID healthcarechannel \
  --name healthcare \
  --version 1.0 \
  --sequence 1 \
  --peerAddresses peer0.org1.example.com:7051 \
  --peerAddresses peer0.org2.example.com:9051
```

---

