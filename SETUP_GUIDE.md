# Healthcare Blockchain System - Complete Setup Guide

## Project Overview

Your healthcare blockchain system is now complete! Here's what has been implemented based on your flowchart:

### Implemented Features

1. **Authentication System**
   - Login for doctors and patients
   - JWT-based authentication
   - Role-based access control

2. **Medical Record Management**
   - Doctors can create medical records
   - Hash generation for data integrity
   - MySQL database storage
   - Blockchain transaction logging

3. **Permission System**
   - Patients can grant/revoke access to doctors
   - Permission validation before record access
   - Real-time permission management

4. **Hash Validation**
   - SHA-256 hash generation
   - Automatic validation on record creation
   - Tamper detection

5. **Blockchain Integration**
   - Hyperledger Fabric chaincode
   - Immutable audit trail
   - Transaction metadata storage

6. **Audit Logs**
   - Database validation logs
   - Blockchain audit trail
   - Permission tracking

## Quick Start Guide

### Step 1: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

### Step 2: Set Up MySQL Database

1. Install MySQL Server if not already installed
2. Start MySQL service:
```powershell
net start MySQL
```

3. Create the database:
```powershell
mysql -u root -p < database/schema.sql
```

Or manually in MySQL:
```sql
CREATE DATABASE healthcare_blockchain;
USE healthcare_blockchain;
-- Then copy and paste the schema from database/schema.sql
```

### Step 3: Configure Environment Variables

Edit the `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=healthcare_blockchain
DB_PORT=3306

JWT_SECRET=change_this_to_a_random_secret_key
```

### Step 4: Start the Application (Without Blockchain First)

For testing without Hyperledger Fabric setup:

```powershell
npm start
```

The application will run at: **http://localhost:3000**

### Step 5: Test the Application

**Default Login Credentials:**
- Doctor: `dr.smith@hospital.com` / `password123`
- Patient: `patient1@email.com` / `password123`

## Hyperledger Fabric Setup (Optional)

Setting up Hyperledger Fabric is complex and requires:

### Prerequisites:
- Docker Desktop for Windows
- Hyperledger Fabric binaries
- Fabric samples repository

### Quick Fabric Setup:

1. **Install Docker Desktop** from https://www.docker.com/products/docker-desktop

2. **Download Fabric Samples:**
```powershell
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples
```

3. **Install Fabric Binaries:**
```powershell
curl -sSL https://bit.ly/2ysbOFE | bash -s
```

4. **Start Test Network:**
```powershell
cd test-network
./network.sh up createChannel -c healthcarechannel
```

5. **Deploy Your Chaincode:**
```powershell
./network.sh deployCC -ccn medicalrecords -ccp E:/blokcen/fabric-network/chaincode -ccl javascript
```

### Alternative: Run Without Blockchain

The application is designed to work gracefully without Fabric:
- Medical records are stored in MySQL
- Hash validation still works
- Blockchain transactions are logged but not stored on-chain
- You can add Fabric integration later

## Project Structure

```
healthcare-blockchain/
├── server.js                 # Express server entry point
├── package.json              # Dependencies
├── .env                      # Configuration
├── config/
│   ├── database.js          # MySQL connection
│   └── fabric.js            # Hyperledger Fabric connection
├── controllers/             # Business logic
│   ├── authController.js
│   ├── recordController.js
│   ├── permissionController.js
│   └── auditController.js
├── routes/                  # API endpoints
│   ├── authRoutes.js
│   ├── recordRoutes.js
│   ├── permissionRoutes.js
│   └── auditRoutes.js
├── middleware/
│   └── auth.js             # Authentication middleware
├── utils/
│   └── hashUtils.js        # Hash generation & validation
├── public/                 # Frontend files
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── database/
│   └── schema.sql          # Database schema
└── fabric-network/         # Hyperledger Fabric setup
    ├── chaincode/
    │   ├── medicalRecords.js
    │   └── package.json
    ├── connection-profile.json
    └── startNetwork.sh
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Medical Records
- `POST /api/records` - Create medical record (Doctor only)
- `GET /api/records` - Get all accessible records
- `GET /api/records/:id` - Get specific record

### Permissions
- `POST /api/permissions` - Grant/revoke access (Patient only)
- `GET /api/permissions` - Get all permissions
- `GET /api/permissions/doctors/all` - Get all doctors
- `GET /api/permissions/patients/my` - Get my patients (Doctor only)

### Audit
- `GET /api/audit/:recordId` - Get audit trail for record
- `GET /api/audit/logs/all` - Get all validation logs

## How It Works (Based on Your Flowchart)

### 1. Doctor Creates Medical Record
```
Doctor Login → Select Patient → Create Record → Generate Hash
```

### 2. Hash Validation
```
System Generates Hash → Validate → Store in Database
```
- Valid: Proceed to blockchain
- Invalid: Log validation error

### 3. Blockchain Storage
```
Valid Record → Store Metadata on Blockchain → Log Audit Event
```

### 4. Permission Management
```
Patient → Grant Permission to Doctor → Doctor Can Access Records
```
- Permission Granted: Access allowed
- No Permission: Access denied + logged

### 5. Access Control
```
Request Access → Check Permission → Verify Hash → Return Record
```

## Testing Workflow

### As a Patient:
1. Login with patient credentials
2. Go to "Permissions" tab
3. Click "Grant Access to Doctor"
4. Select a doctor and grant access
5. View your medical records in "Medical Records" tab
6. Check "Audit Logs" to see permission grants

### As a Doctor:
1. Login with doctor credentials
2. Go to "Create Record" tab
3. Select a patient (only shows patients who granted you access)
4. Fill in diagnosis, treatment, medications
5. Submit - record will be hashed and stored
6. View all accessible records in "Medical Records" tab
7. Click on a record to see details including hash validation status

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Role-based access control
- SHA-256 hash validation
- Permission-based record access
- Audit trail logging
- SQL injection prevention (parameterized queries)

## Troubleshooting

### Database Connection Error
```
Error: ER_ACCESS_DENIED_ERROR
```
**Solution:** Check MySQL credentials in `.env` file

### Port Already in Use
```
Error: Port 3000 already in use
```
**Solution:** Change PORT in `.env` or kill the process:
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Blockchain Connection Failed
```
Warning: Fabric Connection Error
```
**Solution:** This is normal if Fabric is not set up. The app continues to work with MySQL only.

## Next Steps

1. **Test Basic Functionality** (without blockchain)
   - Login system
   - Create records
   - Permission management
   - Hash validation

2. **Set Up Hyperledger Fabric** (optional, for production)
   - Install Docker
   - Set up Fabric network
   - Deploy chaincode

3. **Enhancements** (future)
   - Add patient profile pictures
   - Implement record updates (with new hash)
   - Add record search/filtering
   - Email notifications
   - Export records to PDF
   - Multi-organization support

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Blockchain:** Hyperledger Fabric
- **Authentication:** JWT (JSON Web Tokens)
- **Cryptography:** SHA-256 hashing, bcrypt

## Support

If you encounter issues:
1. Check console logs in browser (F12)
2. Check terminal logs for server errors
3. Verify database connection
4. Ensure all npm packages are installed

## Congratulations!

Your healthcare blockchain system is ready to use! Start the server with `npm start` and visit http://localhost:3000

Happy coding!
