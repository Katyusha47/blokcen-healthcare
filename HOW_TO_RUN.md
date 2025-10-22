# QUICK START GUIDE

## Where is Everything?

### Smart Contract Location:
```
E:\blokcen\fabric-network\chaincode\medicalRecords.js
```

This is your **Hyperledger Fabric chaincode** (smart contract) that:
- Stores medical record metadata on blockchain
- Creates immutable audit trails
- Queries record history
- Tracks access events

**Functions in the Smart Contract:**
1. `initLedger()` - Initialize the blockchain
2. `createMedicalRecord()` - Store record metadata
3. `queryMedicalRecord()` - Get record details
4. `getRecordHistory()` - Get audit trail
5. `recordAccess()` - Log access events
6. `queryRecordsByPatient()` - Query by patient
7. `queryRecordsByDoctor()` - Query by doctor

---

## How to Run the Website

### METHOD 1: Quick Start (Windows)

**Step 1: Setup Database (ONE TIME ONLY)**
1. Open MySQL Command Line Client or MySQL Workbench
2. Run this command:
```sql
CREATE DATABASE healthcare_blockchain;
USE healthcare_blockchain;
SOURCE E:/blokcen/database/schema.sql;
```

OR double-click: `setup-database.bat`

**Step 2: Configure Environment**
1. Open `.env` file in the project root
2. Update your MySQL password:
```
DB_PASSWORD=your_actual_mysql_password
```

**Step 3: Start the Server**
Double-click: `start.bat`

OR in PowerShell:
```powershell
npm start
```

**Step 4: Open Browser**
Go to: **http://localhost:3000**

---

### METHOD 2: Manual Step-by-Step

**1. Check if MySQL is running:**
```powershell
# Start MySQL service if not running
net start MySQL
```

**2. Create the database:**
```powershell
cd E:\blokcen
mysql -u root -p < database\schema.sql
```
Enter your MySQL password when prompted.

**3. Edit .env file:**
```powershell
notepad .env
```
Update:
```
DB_PASSWORD=your_password_here
```

**4. Start the server:**
```powershell
npm start
```

**5. Open browser:**
```
http://localhost:3000
```

---

## Default Login Credentials

After setting up the database, use these to login:

### Doctors:
- Email: `dr.smith@hospital.com`
- Password: `password123`

OR

- Email: `dr.jane@hospital.com`
- Password: `password123`

### Patients:
- Email: `patient1@email.com`
- Password: `password123`

OR

- Email: `patient2@email.com`
- Password: `password123`

---

## Important File Locations

```
E:\blokcen\
│
├── WEBSITE FILES:
│   ├── server.js                    # Main server (backend)
│   ├── public\index.html            # Main page (frontend)
│   ├── public\js\app.js             # Frontend JavaScript
│   └── public\css\style.css         # Styles
│
├── SMART CONTRACT (BLOCKCHAIN):
│   └── fabric-network\chaincode\medicalRecords.js
│
├── DATABASE:
│   └── database\schema.sql          # MySQL schema
│
├── BACKEND:
│   ├── config\                      # Database & Blockchain config
│   ├── controllers\                 # Business logic
│   ├── routes\                      # API endpoints
│   └── middleware\                  # Authentication
│
└── QUICK START:
    ├── start.bat                    # Run the website
    └── setup-database.bat           # Setup database
```

---

## Quick Verification

After starting the server, you should see:
```
Server running on http://localhost:3000
Environment: development
MySQL Database Connected Successfully
```

If you see:
```
MySQL Connection Error
```
That means:
1. MySQL is not running → Start it: `net start MySQL`
2. Wrong password in `.env` → Update DB_PASSWORD
3. Database not created → Run `setup-database.bat`

---

## What to Do First

1. **Setup Database** - Run `setup-database.bat`
2. **Update .env** - Set your MySQL password
3. **Start Server** - Run `start.bat` or `npm start`
4. **Open Browser** - Go to http://localhost:3000
5. **Login** - Use credentials above
6. **Test Features**:
   - Login as patient → Grant permission to doctor
   - Login as doctor → Create medical record
   - View audit logs

---

## Troubleshooting

### Problem: "Cannot connect to MySQL"
**Solution:**
```powershell
# Start MySQL service
net start MySQL

# Or check if MySQL is running
services.msc
# Look for "MySQL" service and start it
```

### Problem: "Port 3000 already in use"
**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Problem: "Database 'healthcare_blockchain' doesn't exist"
**Solution:**
```powershell
# Run database setup
setup-database.bat

# Or manually:
mysql -u root -p
CREATE DATABASE healthcare_blockchain;
USE healthcare_blockchain;
SOURCE E:/blokcen/database/schema.sql;
```

---

## Smart Contract Details

The smart contract is **already integrated** in the backend:

**Location:** `E:\blokcen\config\fabric.js`

This file connects your Express.js backend to Hyperledger Fabric and calls the smart contract functions.

**When is it used?**
- When a doctor creates a medical record
- When accessing audit trails
- When querying blockchain history

**Note:** The app works WITHOUT Hyperledger Fabric setup initially. Records are stored in MySQL with hash validation. Blockchain is optional for now and can be added later.

---

## Need Help?

Check these files:
- **Setup Issues:** `SETUP_GUIDE.md`
- **Architecture:** `ARCHITECTURE.md`
- **Features:** `PROJECT_SUMMARY.md`
- **Code Examples:** Check `controllers/` folder

---

## You're Ready!

The website is at: **http://localhost:3000**

Just setup the database and start the server!
