# Healthcare Blockchain System

A blockchain-based healthcare patient data management system using Hyperledger Fabric.

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Express.js (Node.js)
- **Database**: MySQL
- **Blockchain**: Hyperledger Fabric

## Features
- Medical record management
- Patient permission-based access control
- Hash validation before blockchain storage
- Immutable audit trail on blockchain
- Doctor and patient role management

## Installation

### Prerequisites
- Node.js (v14+)
- MySQL (v8+)
- Docker & Docker Compose (for Hyperledger Fabric)

### Steps

1. **Clone and Install Dependencies**
```bash
npm install
```

2. **Configure Environment Variables**
Edit `.env` file with your database credentials and Fabric network settings.

3. **Set Up MySQL Database**
```bash
mysql -u root -p < database/schema.sql
```

4. **Start Hyperledger Fabric Network**
```bash
cd fabric-network
./startNetwork.sh
```

5. **Start the Application**
```bash
npm start
```

6. **Access the Application**
Open browser: `http://localhost:3000`

## Project Structure
```
healthcare-blockchain/
├── server.js                 # Main Express server
├── config/
│   ├── database.js          # MySQL connection
│   └── fabric.js            # Hyperledger Fabric config
├── controllers/             # Business logic
├── routes/                  # API routes
├── models/                  # Database models
├── middleware/              # Auth & validation
├── utils/                   # Helper functions
├── public/                  # Frontend files
│   ├── css/
│   ├── js/
│   └── index.html
├── fabric-network/          # Hyperledger Fabric setup
│   ├── chaincode/
│   └── connection-profile.json
└── database/
    └── schema.sql
```

## Default Login Credentials
- **Doctor**: `doctor@hospital.com` / `password123`
- **Patient**: `patient@hospital.com` / `password123`

## API Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/records` - Create medical record
- `GET /api/records/:id` - Get medical record
- `POST /api/permissions` - Grant/revoke access
- `GET /api/audit/:recordId` - View audit trail

## License
MIT
