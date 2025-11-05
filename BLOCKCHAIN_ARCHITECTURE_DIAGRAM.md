# Blockchain Architecture Diagram - Healthcare System

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Frontend)                            │
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
                              │ HTTP/HTTPS Requests
                              │ REST API Calls
┌─────────────────────────────▼────────────────────────────────────────────────┐
│                      APPLICATION LAYER (Backend)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────┐          │
│  │              Node.js Express Server (Port 3000)               │          │
│  ├───────────────────────────────────────────────────────────────┤          │
│  │                                                                │          │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │          │
│  │  │ Auth Routes  │  │Record Routes │  │ Audit Routes │       │          │
│  │  │ /api/auth    │  │ /api/records │  │ /api/audit   │       │          │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │          │
│  │         │                 │                  │                │          │
│  │         └─────────────────┴──────────────────┘                │          │
│  │                           │                                   │          │
│  │  ┌────────────────────────▼─────────────────────────┐        │          │
│  │  │           Controllers Layer                      │        │          │
│  │  │  • authController.js                            │        │          │
│  │  │  • recordController.js                          │        │          │
│  │  │  • auditController.js                           │        │          │
│  │  │  • permissionController.js                      │        │          │
│  │  └────────┬──────────────────────────┬─────────────┘        │          │
│  │           │                          │                       │          │
│  └───────────┼──────────────────────────┼───────────────────────┘          │
│              │                          │                                   │
│     ┌────────▼────────┐        ┌───────▼──────────┐                       │
│     │  MySQL Database │        │  Fabric SDK      │                       │
│     │  (Port 3306)    │        │  fabric-network  │                       │
│     │                 │        │                  │                       │
│     │ • users         │        │ • Gateway        │                       │
│     │ • medical_records│       │ • Wallet         │                       │
│     │ • permissions   │        │ • Contract       │                       │
│     │ • access_logs   │        └───────┬──────────┘                       │
│     └─────────────────┘                │                                   │
│                                        │ gRPC over TLS                     │
└────────────────────────────────────────┼───────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼───────────────────────────────────┐
│                    BLOCKCHAIN LAYER (Hyperledger Fabric)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────┐          │
│  │                    Fabric Network Channel                      │          │
│  │                   (healthcarechannel)                          │          │
│  └───────────────────────────────────────────────────────────────┘          │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Smart Contract Layer                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌──────────────────────────────────────────────────────────┐       │   │
│  │  │      Healthcare Chaincode (medicalRecords.js)            │       │   │
│  │  ├──────────────────────────────────────────────────────────┤       │   │
│  │  │  Functions:                                              │       │   │
│  │  │  • initLedger()                                          │       │   │
│  │  │  • createMedicalRecord(data)                            │       │   │
│  │  │  • queryMedicalRecord(recordId)                         │       │   │
│  │  │  • getRecordHistory(recordId)                           │       │   │
│  │  │  • recordAccess(recordId, userId)                       │       │   │
│  │  │  • queryRecordsByPatient(patientId)                     │       │   │
│  │  │  • queryRecordsByDoctor(doctorId)                       │       │   │
│  │  │  • queryAllMedicalRecords()                             │       │   │
│  │  └──────────────────────────────────────────────────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Consensus & Ordering                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────┐           │   │
│  │  │            Orderer Node                              │           │   │
│  │  │         (orderer.example.com)                        │           │   │
│  │  │          Port: 7050                                  │           │   │
│  │  │                                                       │           │   │
│  │  │  • Transaction Ordering                              │           │   │
│  │  │  • Block Creation                                    │           │   │
│  │  │  • Consensus (Raft)                                  │           │   │
│  │  └───────────────────┬──────────────────────────────────┘           │   │
│  │                      │                                               │   │
│  │         ┌────────────┴────────────┐                                 │   │
│  │         │                         │                                 │   │
│  └─────────┼─────────────────────────┼─────────────────────────────────┘   │
│            │                         │                                     │
│  ┌─────────▼──────────┐    ┌────────▼──────────┐                          │
│  │  Organization 1    │    │  Organization 2   │                          │
│  │    (Org1MSP)       │    │    (Org2MSP)      │                          │
│  ├────────────────────┤    ├───────────────────┤                          │
│  │                    │    │                   │                          │
│  │ ┌────────────────┐ │    │ ┌────────────────┐│                          │
│  │ │  Peer Node     │ │    │ │  Peer Node     ││                          │
│  │ │  peer0.org1    │ │    │ │  peer0.org2    ││                          │
│  │ │  Port: 7051    │ │    │ │  Port: 9051    ││                          │
│  │ ├────────────────┤ │    │ ├────────────────┤│                          │
│  │ │ • Endorsement  │ │    │ │ • Endorsement  ││                          │
│  │ │ • Validation   │ │    │ │ • Validation   ││                          │
│  │ │ • State DB     │ │    │ │ • State DB     ││                          │
│  │ │ • Ledger       │ │    │ │ • Ledger       ││                          │
│  │ └────────┬───────┘ │    │ └────────┬───────┘│                          │
│  │          │         │    │          │        │                          │
│  │ ┌────────▼───────┐ │    │ ┌────────▼───────┐│                          │
│  │ │   CouchDB      │ │    │ │   CouchDB      ││                          │
│  │ │  (State DB)    │ │    │ │  (State DB)    ││                          │
│  │ └────────────────┘ │    │ └────────────────┘│                          │
│  │                    │    │                   │                          │
│  │ ┌────────────────┐ │    │ ┌────────────────┐│                          │
│  │ │  Certificate   │ │    │ │  Certificate   ││                          │
│  │ │  Authority     │ │    │ │  Authority     ││                          │
│  │ │  (CA)          │ │    │ │  (CA)          ││                          │
│  │ │  Port: 7054    │ │    │ │  Port: 8054    ││                          │
│  │ └────────────────┘ │    │ └────────────────┘│                          │
│  └────────────────────┘    └───────────────────┘                          │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CREATE MEDICAL RECORD FLOW                             │
└──────────────────────────────────────────────────────────────────────────┘

    Doctor                Web App            Node.js Server      MySQL DB      Fabric Network
      │                      │                      │               │               │
      │  1. Create Record    │                      │               │               │
      ├─────────────────────►│                      │               │               │
      │                      │  2. POST /api/records │               │               │
      │                      ├─────────────────────►│               │               │
      │                      │                      │ 3. Save Data  │               │
      │                      │                      ├──────────────►│               │
      │                      │                      │◄──────────────┤               │
      │                      │                      │ 4. Calculate  │               │
      │                      │                      │    Hash       │               │
      │                      │                      │               │               │
      │                      │                      │ 5. Submit Transaction         │
      │                      │                      ├──────────────────────────────►│
      │                      │                      │               │  6. Endorse   │
      │                      │                      │               │  (Org1+Org2)  │
      │                      │                      │               │               │
      │                      │                      │               │  7. Order     │
      │                      │                      │               │  Block        │
      │                      │                      │               │               │
      │                      │                      │               │  8. Validate  │
      │                      │                      │               │  & Commit     │
      │                      │                      │               │               │
      │                      │                      │  9. TX ID     │               │
      │                      │                      │◄──────────────────────────────┤
      │                      │  10. Success         │               │               │
      │                      │      + TX ID         │               │               │
      │◄─────────────────────┤◄─────────────────────┤               │               │
      │                      │                      │               │               │
      │  11. Display         │                      │               │               │
      │      Confirmation    │                      │               │               │
      │                      │                      │               │               │
```

## Query Medical Record Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    QUERY MEDICAL RECORD FLOW                              │
└──────────────────────────────────────────────────────────────────────────┘

    Patient               Web App            Node.js Server      MySQL DB      Fabric Network
      │                      │                      │               │               │
      │  1. View Record      │                      │               │               │
      ├─────────────────────►│                      │               │               │
      │                      │  2. GET /api/records/:id             │               │
      │                      ├─────────────────────►│               │               │
      │                      │                      │ 3. Query Data │               │
      │                      │                      ├──────────────►│               │
      │                      │                      │◄──────────────┤               │
      │                      │                      │               │               │
      │                      │                      │ 4. Query Blockchain           │
      │                      │                      ├──────────────────────────────►│
      │                      │                      │               │  5. Get       │
      │                      │                      │               │  History      │
      │                      │                      │               │               │
      │                      │                      │  6. History   │               │
      │                      │                      │◄──────────────────────────────┤
      │                      │                      │               │               │
      │                      │                      │ 7. Verify     │               │
      │                      │                      │    Hash       │               │
      │                      │                      │               │               │
      │                      │  8. Record Data      │               │               │
      │                      │     + Audit Trail    │               │               │
      │◄─────────────────────┤◄─────────────────────┤               │               │
      │                      │                      │               │               │
      │  9. Display Record   │                      │               │               │
      │     with Verification│                      │               │               │
      │                      │                      │               │               │
```

## Component Details

### 1. Client Layer Components

```
┌────────────────────────────────────────────────────────┐
│                 Client Applications                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Doctor Dashboard:                                      │
│  • Create medical records                              │
│  • View assigned patients                              │
│  • Access granted records                              │
│  • View audit logs                                     │
│                                                         │
│  Patient Dashboard:                                     │
│  • View own medical records                            │
│  • Grant/revoke permissions                            │
│  • View access history                                 │
│  • Download records                                    │
│                                                         │
│  Admin Dashboard:                                       │
│  • User management                                     │
│  • System monitoring                                   │
│  • Audit trail review                                  │
│  • Blockchain status                                   │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 2. Application Layer Components

```
┌────────────────────────────────────────────────────────┐
│              Node.js Express Server                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Routes:                                                │
│  ├── /api/auth          → Authentication               │
│  ├── /api/records       → Medical Records CRUD         │
│  ├── /api/permissions   → Access Control               │
│  └── /api/audit         → Audit Logs                   │
│                                                         │
│  Middleware:                                            │
│  ├── JWT Authentication                                │
│  ├── Role-based Access Control                         │
│  ├── Request Validation                                │
│  └── Error Handling                                    │
│                                                         │
│  Controllers:                                           │
│  ├── authController     → Login/Register               │
│  ├── recordController   → CRUD Operations              │
│  ├── permissionController → Permissions                │
│  └── auditController    → Audit Trails                 │
│                                                         │
│  Utils:                                                 │
│  ├── hashUtils         → SHA-256 Hashing               │
│  └── fabricConnection  → Blockchain Integration        │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 3. Blockchain Layer Components

```
┌────────────────────────────────────────────────────────────────┐
│              Hyperledger Fabric Network                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Orderer Node:                                                  │
│  • Receives transactions from clients                          │
│  • Orders transactions into blocks                             │
│  • Distributes blocks to peers                                │
│  • Consensus: Raft (Solo/Kafka/Raft)                          │
│                                                                 │
│  Peer Nodes (Org1 & Org2):                                     │
│  • Endorses transactions (validates business logic)            │
│  • Commits validated blocks to ledger                          │
│  • Maintains world state database (CouchDB)                    │
│  • Executes chaincode                                          │
│                                                                 │
│  Chaincode (Smart Contract):                                   │
│  • Written in Node.js                                          │
│  • Deployed on peers                                           │
│  • Manages medical record metadata                             │
│  • Enforces business rules                                     │
│                                                                 │
│  Certificate Authority (CA):                                    │
│  • Issues digital certificates                                 │
│  • Manages identities                                          │
│  • Enrollment & registration                                   │
│                                                                 │
│  Ledger Structure:                                              │
│  ├── Blockchain (Immutable chain of blocks)                    │
│  │   └── Each block contains multiple transactions            │
│  └── World State (Current state database)                      │
│      └── Key-value pairs of current data                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Transaction Flow Detail

```
┌──────────────────────────────────────────────────────────────────────┐
│              Transaction Endorsement & Validation Flow                │
└──────────────────────────────────────────────────────────────────────┘

1. Proposal Phase:
   ┌────────┐
   │ Client │ Creates transaction proposal
   └───┬────┘
       │
       ├──────► Peer 0 (Org1) ──► Simulates transaction
       │                          Generates Read-Write Set
       │                          Signs endorsement
       │                          
       └──────► Peer 0 (Org2) ──► Simulates transaction
                                   Generates Read-Write Set
                                   Signs endorsement

2. Ordering Phase:
   ┌──────────────┐
   │ Endorsements │ Collected from peers
   └──────┬───────┘
          │
          └──────► Orderer ──► Orders transactions
                               Creates block
                               Broadcasts to all peers

3. Validation & Commit Phase:
   ┌───────┐
   │ Block │ Received by all peers
   └───┬───┘
       │
       ├──────► Peer validates:
       │        • Endorsement policy satisfied?
       │        • Read-Write set conflicts?
       │        • Transaction valid?
       │
       └──────► Commits valid transactions to ledger
                Updates world state
                Emits block events
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Application Security:                                        │
│     ├── JWT Token Authentication                                │
│     ├── Role-Based Access Control (RBAC)                        │
│     ├── Password Hashing (bcrypt)                               │
│     └── SQL Injection Prevention                                │
│                                                                  │
│  2. Data Security:                                               │
│     ├── SHA-256 Hash for Data Integrity                         │
│     ├── MySQL Encrypted Connection                              │
│     └── Environment Variables for Secrets                        │
│                                                                  │
│  3. Blockchain Security:                                         │
│     ├── TLS/SSL for all communications                          │
│     ├── X.509 Certificate-based authentication                  │
│     ├── MSP (Membership Service Provider)                       │
│     ├── Channel isolation                                       │
│     ├── Endorsement policies                                    │
│     └── Immutable ledger                                        │
│                                                                  │
│  4. Network Security:                                            │
│     ├── gRPC over TLS                                           │
│     ├── Private channels                                        │
│     └── Firewall rules                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Deployment Topology                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Development Environment:                                         │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Single Machine (Ubuntu VM)                        │          │
│  │                                                     │          │
│  │  • Node.js App (Port 3000)                         │          │
│  │  • MySQL Database (Port 3306)                      │          │
│  │  • Fabric Network (Docker containers)              │          │
│  │    - Orderer (Port 7050)                           │          │
│  │    - Peer0.Org1 (Port 7051)                        │          │
│  │    - Peer0.Org2 (Port 9051)                        │          │
│  │    - CA Org1 (Port 7054)                           │          │
│  │    - CA Org2 (Port 8054)                           │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                   │
│  Production Environment (Recommended):                            │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Load Balancer                                     │          │
│  │         │                                          │          │
│  │    ┌────┴────┐                                     │          │
│  │    │         │                                     │          │
│  │  App1      App2      App3                          │          │
│  │    │         │         │                           │          │
│  │    └────┬────┴────┬────┘                           │          │
│  │         │         │                                │          │
│  │    ┌────▼─────────▼────┐                           │          │
│  │    │  MySQL Cluster    │                           │          │
│  │    └───────────────────┘                           │          │
│  │                                                     │          │
│  │  Fabric Network (Distributed):                     │          │
│  │    ┌─────────────┐      ┌─────────────┐           │          │
│  │    │   Org1      │      │   Org2      │           │          │
│  │    │  Hospital A │      │  Hospital B │           │          │
│  │    │             │      │             │           │          │
│  │    │  Peer Nodes │      │  Peer Nodes │           │          │
│  │    │  CA Server  │      │  CA Server  │           │          │
│  │    └─────────────┘      └─────────────┘           │          │
│  │           │                     │                  │          │
│  │           └──────────┬──────────┘                  │          │
│  │                      │                             │          │
│  │              ┌───────▼───────┐                     │          │
│  │              │ Orderer Nodes │                     │          │
│  │              │  (Raft Cluster)│                    │          │
│  │              └───────────────┘                     │          │
│  └────────────────────────────────────────────────────┘          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Port Mapping

```
┌────────────────────────────────────────────┐
│        Service Port Configuration           │
├────────────────────────────────────────────┤
│                                             │
│  Application Layer:                         │
│  • Node.js App:           3000             │
│  • MySQL Database:        3306             │
│                                             │
│  Blockchain Layer:                          │
│  • Orderer:              7050              │
│  • Peer0 Org1:           7051              │
│  • Peer0 Org2:           9051              │
│  • CA Org1:              7054              │
│  • CA Org2:              8054              │
│  • CouchDB Org1:         5984              │
│  • CouchDB Org2:         6984              │
│                                             │
└────────────────────────────────────────────┘
```

---

## Summary

Arsitektur sistem healthcare blockchain ini terdiri dari:

1. **Client Layer**: Interface pengguna (doctor, patient, admin)
2. **Application Layer**: Node.js backend dengan REST API
3. **Database Layer**: MySQL untuk data off-chain
4. **Blockchain Layer**: Hyperledger Fabric untuk audit trail immutable

**Keunggulan Arsitektur:**
- ✅ Separation of concerns
- ✅ Scalable & distributed
- ✅ Secure with multi-layer security
- ✅ Immutable audit trail
- ✅ High availability
- ✅ Privacy-preserving
