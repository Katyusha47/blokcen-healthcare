# Healthcare Blockchain - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  HTML + CSS + JavaScript + Bootstrap                  │  │
│  │  - Login Page                                          │  │
│  │  - Dashboard (Role-based)                             │  │
│  │  - Medical Records UI                                  │  │
│  │  - Permission Management                               │  │
│  │  - Audit Logs Viewer                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓↑ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Express.js Server (Node.js)                 │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │ Auth Routes  │  │ Record Routes│  │ Permission │  │  │
│  │  │              │  │              │  │   Routes   │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │  │
│  │         ↓                  ↓                  ↓        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │    Auth      │  │    Record    │  │ Permission │  │  │
│  │  │ Controller   │  │  Controller  │  │ Controller │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │         Middleware Layer                      │    │  │
│  │  │  - JWT Authentication                         │    │  │
│  │  │  - Role-based Authorization                   │    │  │
│  │  │  - CORS                                        │    │  │
│  │  │  - Body Parser                                 │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │         Utilities                             │    │  │
│  │  │  - Hash Generation (SHA-256)                  │    │  │
│  │  │  - Hash Verification                          │    │  │
│  │  │  - Transaction ID Generation                  │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                      ↓↑                    ↓↑
       ┌──────────────────────┐   ┌────────────────────────┐
       │   DATABASE LAYER      │   │  BLOCKCHAIN LAYER      │
       │  ┌────────────────┐   │   │  ┌──────────────────┐ │
       │  │     MySQL      │   │   │  │ Hyperledger      │ │
       │  │                │   │   │  │    Fabric        │ │
       │  │ Tables:        │   │   │  │                  │ │
       │  │ - users        │   │   │  │ Chaincode:       │ │
       │  │ - records      │   │   │  │ - createRecord   │ │
       │  │ - permissions  │   │   │  │ - queryRecord    │ │
       │  │ - audit_logs   │   │   │  │ - getHistory     │ │
       │  └────────────────┘   │   │  │ - recordAccess   │ │
       │                        │   │  └──────────────────┘ │
       └────────────────────────┘   └────────────────────────┘
```

## Data Flow Diagram

### 1. Doctor Creates Medical Record

```
┌─────────┐       ┌─────────┐       ┌──────────┐       ┌───────────┐
│ Doctor  │──1──→ │ Express │──2──→ │  MySQL   │──3──→ │ Generate  │
│   UI    │       │  Server │       │ Database │       │   Hash    │
└─────────┘       └─────────┘       └──────────┘       └───────────┘
                        ↓                                       ↓
                        └────────────────────────────────────→ ↓
                                      4. Validate Hash          ↓
                                                                ↓
                        ┌────────────────────────────────────← ┘
                        ↓
                  ┌───────────┐       ┌────────────────┐
                  │ Hyperledger│←─5──│ Store Metadata │
                  │   Fabric   │      │  on Blockchain │
                  └───────────┘       └────────────────┘
                        ↓
                  6. Log Audit Event
                        ↓
                  ┌──────────┐
                  │  Return  │
                  │ Success  │
                  └──────────┘
```

### 2. Patient Grants Permission

```
┌─────────┐       ┌─────────┐       ┌──────────┐
│ Patient │──1──→ │ Express │──2──→ │  MySQL   │
│   UI    │       │  Server │       │ Database │
└─────────┘       └─────────┘       └──────────┘
                        ↓
                        │ 3. Insert/Update
                        │    Permissions
                        ↓
                  ┌──────────┐
                  │  Verify  │
                  │  Doctor  │
                  │  Exists  │
                  └──────────┘
                        ↓
                  4. Create Permission
                        ↓
                  ┌──────────┐
                  │  Return  │
                  │ Success  │
                  └──────────┘
```

### 3. Doctor Accesses Record

```
┌─────────┐       ┌─────────┐       ┌──────────┐
│ Doctor  │──1──→ │ Express │──2──→ │  Check   │
│   UI    │       │  Server │       │Permission│
└─────────┘       └─────────┘       └──────────┘
                        ↓                  │
                        │                  │ Granted?
                        │                  ↓
                  ┌─────────────────────────┐
                  │     Permission OK       │
                  └─────────────────────────┘
                        ↓
                  ┌──────────┐       ┌──────────┐
                  │  MySQL   │──3──→ │  Verify  │
                  │ Database │       │   Hash   │
                  └──────────┘       └──────────┘
                        ↓                  │
                        │ 4. Return Record │
                        ↓←─────────────────┘
                  ┌──────────┐
                  │   Log    │
                  │  Access  │
                  └──────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: Authentication                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - JWT Token Verification                          │ │
│  │ - Password Hashing (bcrypt)                       │ │
│  │ - Session Management                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Layer 2: Authorization                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - Role-based Access Control (RBAC)                │ │
│  │ - Permission Validation                           │ │
│  │ - Resource-level Authorization                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Layer 3: Data Integrity                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - SHA-256 Hash Generation                         │ │
│  │ - Hash Verification                               │ │
│  │ - Tamper Detection                                │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Layer 4: Blockchain Immutability                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - Distributed Ledger                              │ │
│  │ - Immutable Audit Trail                           │ │
│  │ - Smart Contract Validation                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Layer 5: Network Security                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - CORS Configuration                              │ │
│  │ - SQL Injection Prevention                        │ │
│  │ - XSS Protection                                  │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌─────────────────────────┐
│        USERS            │
│─────────────────────────│
│ id (PK)                 │
│ email (UNIQUE)          │
│ password (HASHED)       │
│ full_name               │
│ role (doctor/patient)   │
│ phone                   │
└─────────────────────────┘
         ↓ ↑
         │ │
         │ └──────────────────────────────┐
         │                                │
         ↓                                ↑
┌────────────────────────────┐    ┌──────────────────────┐
│   MEDICAL_RECORDS          │    │ ACCESS_PERMISSIONS   │
│────────────────────────────│    │──────────────────────│
│ id (PK)                    │    │ id (PK)              │
│ patient_id (FK → users)    │    │ patient_id (FK)      │
│ doctor_id (FK → users)     │    │ doctor_id (FK)       │
│ diagnosis                  │    │ granted (BOOL)       │
│ treatment                  │    │ granted_at           │
│ medications                │    │ revoked_at           │
│ notes                      │    └──────────────────────┘
│ record_hash (SHA-256)      │
│ blockchain_tx_id           │
│ created_at                 │
└────────────────────────────┘
         ↓
         │
         ↓
┌────────────────────────────┐
│    VALIDATION_LOGS         │
│────────────────────────────│
│ id (PK)                    │
│ record_id (FK)             │
│ validation_type            │
│ is_valid (BOOL)            │
│ error_message              │
│ validated_by (FK → users)  │
│ created_at                 │
└────────────────────────────┘
```

## Blockchain Structure

```
┌─────────────────────────────────────────────────────────┐
│              HYPERLEDGER FABRIC NETWORK                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Channel: healthcarechannel                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │   Chaincode: medicalrecords                       │ │
│  │   ┌─────────────────────────────────────────────┐ │ │
│  │   │                                             │ │ │
│  │   │  Functions:                                 │ │ │
│  │   │  - initLedger()                             │ │ │
│  │   │  - createMedicalRecord(data)                │ │ │
│  │   │  - queryMedicalRecord(id)                   │ │ │
│  │   │  - getRecordHistory(id)                     │ │ │
│  │   │  - recordAccess(data)                       │ │ │
│  │   │  - queryRecordsByPatient(id)                │ │ │
│  │   │  - queryRecordsByDoctor(id)                 │ │ │
│  │   │                                             │ │ │
│  │   └─────────────────────────────────────────────┘ │ │
│  │                                                   │ │
│  │   Stored Data:                                    │ │
│  │   {                                               │ │
│  │     recordId: string,                             │ │
│  │     patientId: string,                            │ │
│  │     doctorId: string,                             │ │
│  │     recordHash: string (SHA-256),                 │ │
│  │     timestamp: datetime,                          │ │
│  │     action: string,                               │ │
│  │     txId: string                                  │ │
│  │   }                                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## API Request Flow

```
Client Request
     ↓
[1] Express.js receives request
     ↓
[2] CORS middleware checks origin
     ↓
[3] Body parser parses request data
     ↓
[4] Route handler matches endpoint
     ↓
[5] Auth middleware verifies JWT token
     ↓
[6] Controller receives request
     ↓
[7] Business logic validation
     ↓
[8] Database query/operation
     │
     ├→ [If creating record]
     │   ├→ Generate hash
     │   ├→ Save to MySQL
     │   ├→ Submit to blockchain
     │   └→ Log audit event
     │
     ├→ [If checking permission]
     │   ├→ Query permissions table
     │   └→ Validate access
     │
     └→ [If reading record]
         ├→ Check permission
         ├→ Fetch from MySQL
         ├→ Verify hash
         └→ Return data
     ↓
[9] Format response (JSON)
     ↓
[10] Send response to client
     ↓
Client receives response
```

## Component Interaction Matrix

```
┌──────────────┬───────┬────────┬────────┬────────┬────────┐
│ Component    │ MySQL │ Fabric │  Hash  │  JWT   │  UI    │
├──────────────┼───────┼────────┼────────┼────────┼────────┤
│ Auth         │  ✓✓   │   -    │   -    │  ✓✓✓   │  ✓✓    │
│ Records      │  ✓✓✓  │  ✓✓    │  ✓✓✓   │   ✓    │  ✓✓✓   │
│ Permissions  │  ✓✓✓  │   ✓    │   -    │   ✓    │  ✓✓    │
│ Audit        │  ✓✓   │  ✓✓✓   │   -    │   ✓    │   ✓    │
│ Validation   │   ✓   │   ✓    │  ✓✓✓   │   -    │   ✓    │
└──────────────┴───────┴────────┴────────┴────────┴────────┘

Legend:
✓✓✓ = Critical dependency
✓✓  = Major dependency
✓   = Minor dependency
-   = No dependency
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Application State                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Client State (localStorage):                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - authToken (JWT)                                 │ │
│  │ - currentUser { id, email, role, fullName }       │ │
│  └───────────────────────────────────────────────────┘ │
│                       ↓↑                                │
│  Server State (Session):                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - JWT payload (decoded)                           │ │
│  │ - Request context                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                       ↓↑                                │
│  Database State (Persistent):                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - User credentials                                │ │
│  │ - Medical records                                 │ │
│  │ - Permissions                                     │ │
│  │ - Audit logs                                      │ │
│  └───────────────────────────────────────────────────┘ │
│                       ↓↑                                │
│  Blockchain State (Immutable):                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - Record metadata                                 │ │
│  │ - Transaction history                             │ │
│  │ - Audit trail                                     │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

This architecture ensures:
- ✅ Separation of concerns
- ✅ Scalability
- ✅ Security at multiple layers
- ✅ Data integrity
- ✅ Immutable audit trail
- ✅ Role-based access control
