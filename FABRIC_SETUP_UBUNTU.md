# Hyperledger Fabric Setup on Ubuntu VM

## Why Ubuntu is Better for Fabric?

- **Native Linux support** - Fabric is designed for Linux
- **Faster performance** - No WSL overhead
- **Easier installation** - Better package management
- **More stable** - Fewer compatibility issues
- **Production-like** - Closer to real deployment environment

## Prerequisites

### VM Requirements:
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS (recommended)
- **RAM**: Minimum 4GB, recommended 8GB
- **CPU**: 2 cores minimum, 4 cores recommended
- **Disk**: 30GB free space minimum
- **Network**: Bridge or NAT with port forwarding

### VM Software Options:
- **VirtualBox** (Free) - https://www.virtualbox.org/
- **VMware Workstation Player** (Free for personal use)
- **Hyper-V** (Windows Pro/Enterprise)

## Part 1: VM Setup

### Step 1: Download Ubuntu

1. Download Ubuntu 22.04 LTS Desktop: https://ubuntu.com/download/desktop
2. Create new VM in VirtualBox/VMware:
   - RAM: 8GB (or 4GB minimum)
   - CPU: 4 cores (or 2 minimum)
   - Disk: 50GB dynamic
   - Network: Bridged Adapter (or NAT with port forwarding)

### Step 2: Install Ubuntu

1. Boot from ISO
2. Choose "Install Ubuntu"
3. Follow installation wizard
4. Create user account
5. Reboot after installation

### Step 3: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

## Part 2: Install Prerequisites

### Step 1: Install cURL, Git, and jq

```bash
sudo apt install -y curl git jq

# Verify jq is installed
jq --version
```

### Step 2: Install Docker

```bash
# Fix broken packages first
sudo apt update
sudo apt --fix-broken install

# Install containerd first (the dependency)
sudo apt install -y containerd

# Now install docker.io
sudo apt install -y docker.io

# If still getting errors, use this alternative:
# sudo apt install -y docker.io --fix-missing

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker is running
sudo systemctl status docker

# Add your user to docker group (no need for sudo commands)
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify installation
docker --version
docker compose version

# Test Docker
docker run hello-world
```

### Step 3: Install Node.js and npm

```bash
# Remove old Node.js version if exists
sudo apt remove nodejs npm

# Install Node.js 16.x (LTS) - Recommended for Fabric
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# OPTIONAL: Upgrade to Node.js 18.x or 20.x (if you need newer version)
# curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# sudo apt install -y nodejs

# Update npm to latest version
sudo npm install -g npm@latest

# Verify again
node --version
npm --version
```

### Step 4: Install Python (for npm native modules)

```bash
sudo apt install -y python3 python3-pip build-essential
```

### Step 5: Install Go (optional, if you want Go chaincode support)

```bash
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz

# Add to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version
```

## Part 3: Install Hyperledger Fabric

### Step 1: Create Working Directory

```bash
mkdir -p ~/fabric
cd ~/fabric
```

### Step 2: Download Fabric Binaries and Docker Images

```bash
# Download Fabric 2.5.0 and Fabric CA 1.5.5
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5

# This will:
# - Download fabric-samples repository
# - Download Fabric binaries (peer, orderer, etc.)
# - Pull Docker images

# This takes 5-15 minutes depending on internet speed
```

### Step 3: Add Binaries to PATH

```bash
# Add to PATH permanently
echo 'export PATH=$PATH:~/fabric/fabric-samples/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
peer version
orderer version
configtxgen --version
```

## Part 4: Copy Your Chaincode to VM

### Option 1: Using Shared Folder (VirtualBox)

**On Windows Host:**
1. VirtualBox → Settings → Shared Folders
2. Add folder: `F:\laragon\www\blokcen\fabric-network\chaincode`
3. Name it: `chaincode`
4. Enable "Auto-mount"

**On Ubuntu VM:**
```bash
# Install VirtualBox Guest Additions
sudo apt install virtualbox-guest-utils virtualbox-guest-dkms

# Access shared folder
sudo mkdir -p /mnt/chaincode
sudo mount -t vboxsf chaincode /mnt/chaincode

# Copy chaincode
mkdir -p ~/fabric/fabric-samples/chaincode/healthcare
cp -r /mnt/chaincode/* ~/fabric/fabric-samples/chaincode/healthcare/
```

### Option 2: Using Git (Recommended)

```bash
# Create chaincode directory if it doesn't exist
mkdir -p ~/fabric/fabric-samples/chaincode

# Clone your repository
cd ~/fabric/fabric-samples/chaincode
git clone https://github.com/Katyusha47/blokcen-healthcare.git

# Copy chaincode files
cp -r blokcen-healthcare/fabric-network/chaincode healthcare

# Clean up (optional)
rm -rf blokcen-healthcare
```

### Option 3: Using SCP from Windows

**On Windows PowerShell:**
```powershell
# Get VM IP address first (run on Ubuntu: ip addr show)
scp -r F:\laragon\www\blokcen\fabric-network\chaincode username@VM_IP:~/fabric/fabric-samples/chaincode/healthcare
```

### Option 4: Manual Copy/Paste

Create the files manually in Ubuntu:

```bash
mkdir -p ~/fabric/fabric-samples/chaincode/healthcare
cd ~/fabric/fabric-samples/chaincode/healthcare

# Create package.json
nano package.json
# Paste content, save with Ctrl+X, Y, Enter

# Create medicalRecords.js
nano medicalRecords.js
# Paste content, save with Ctrl+X, Y, Enter
```

## Part 5: Start Fabric Network

### Step 1: Navigate to Test Network

```bash
cd ~/fabric/fabric-samples/test-network
```

### Step 2: Clean Any Previous Network

```bash
./network.sh down
```

### Step 2.5: Verify Docker is Running (IMPORTANT!)

```bash
# Check if Docker daemon is running
sudo systemctl status docker

# If not running, start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker is working
docker ps

# If you get permission error, add your user to docker group
sudo usermod -aG docker $USER

# Apply the group change (important!)
newgrp docker

# OR logout and login again for group changes to take effect

# Test Docker again
docker run hello-world

# If successful, you should see "Hello from Docker!"
```

### Step 3: Start Network with Channel

```bash
# MAKE SURE you're in the test-network directory
cd ~/fabric/fabric-samples/test-network

# Start network with Certificate Authority
./network.sh up createChannel -c healthcarechannel -ca

# This will:
# - Start orderer
# - Start peer0.org1 and peer0.org2
# - Create channel "healthcarechannel"
# - Join peers to channel
```

### Step 4: Verify Network is Running

```bash
docker ps

# You should see:
# - orderer.example.com
# - peer0.org1.example.com
# - peer0.org2.example.com
# - ca_org1
# - ca_org2
```

## Part 6: Deploy Chaincode

### Step 1: Install Chaincode Dependencies

```bash
cd ~/fabric/fabric-samples/chaincode/healthcare
npm install
cd ~/fabric/fabric-samples/test-network
```

### Step 1.5: Set Fabric Config Path (IMPORTANT!)

```bash
# Make sure you're in test-network directory
cd ~/fabric/fabric-samples/test-network

# Set the Fabric config path environment variable
export FABRIC_CFG_PATH=$PWD/../config/

# Verify path is set
echo $FABRIC_CFG_PATH

# Also make sure binaries are in PATH
export PATH=$PATH:~/fabric/fabric-samples/bin

# Verify peer command works
peer version
```

### Step 2: Package Chaincode

```bash
# Make sure you're in test-network directory
cd ~/fabric/fabric-samples/test-network

# Verify your chaincode exists
ls -la ../chaincode/healthcare/
# Should show: medicalRecords.js, package.json

# Set config path
export FABRIC_CFG_PATH=$PWD/../config/

# Set PATH for binaries
export PATH=$PATH:~/fabric/fabric-samples/bin

# Package chaincode
peer lifecycle chaincode package healthcare.tar.gz --path ../chaincode/healthcare --lang node --label healthcare_1.0

# Verify the package was created
ls -la healthcare.tar.gz
# Should show the file with size

# Check current directory - you should be in test-network
pwd
# Output should be: /home/YOUR_USERNAME/fabric/fabric-samples/test-network
```

### Step 2.5: Verify Network and Organizations Exist

```bash
# Check if organizations directory exists
ls -la organizations/

# You should see:
# - ordererOrganizations/
# - peerOrganizations/

# If NOT, the network wasn't started properly. Run:
cd ~/fabric/fabric-samples/test-network
./network.sh down
./network.sh up createChannel -c healthcarechannel -ca

# Verify Docker containers are running
docker ps
```

### Step 3: Install on Org1 Peer

```bash
# IMPORTANT: Make sure you're in test-network directory
cd ~/fabric/fabric-samples/test-network

# Set environment for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Verify the MSP path exists before installing
ls -la ${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

# Install chaincode
peer lifecycle chaincode install healthcare.tar.gz
```

### Step 4: Install on Org2 Peer

```bash
# Set environment for Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

# Install chaincode
peer lifecycle chaincode install healthcare.tar.gz
```

### Step 5: Get Package ID

```bash
# Query installed chaincode to get the Package ID
peer lifecycle chaincode queryinstalled

# The output will look like this:
# Installed chaincodes on peer:
# Package ID: healthcare_1.0:a1b2c3d4e5f6..., Label: healthcare_1.0
#              ^^^^^^^^^^^^^^^^^^^^^^^^ THIS IS YOUR PACKAGE ID

# EXAMPLE OUTPUT:
# Package ID: healthcare_1.0:5f3c8d9a2b7e4f1c8d9a2b7e4f1c8d9a2b7e4f1c8d9a2b7e4f1c8d9a2b7e

# Copy the FULL Package ID and use it in the next command
# Replace YOUR_PACKAGE_ID_HERE with the actual ID from the output above

# METHOD 1: Manually copy and paste
export CC_PACKAGE_ID=healthcare_1.0:5f3c8d9a2b7e4f1c8d9a2b7e4f1c8d9a2b7e4f1c8d9a2b7e4f1c8d9a2b7e

# METHOD 2: Auto-extract (easier)
export CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep healthcare_1.0 | awk '{print $3}' | sed 's/,//')

# Verify the Package ID is set
echo $CC_PACKAGE_ID
# Should show: healthcare_1.0:5f3c8d9a2b7e4f1c...
```

### Step 6: Approve Chaincode for Org1

```bash
# Switch back to Org1
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Approve
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID healthcarechannel --name healthcare --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
```

### Step 7: Approve Chaincode for Org2

```bash
# Switch to Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

# Approve
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID healthcarechannel --name healthcare --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
```

### Step 8: Check Commit Readiness

```bash
peer lifecycle chaincode checkcommitreadiness --channelID healthcarechannel --name healthcare --version 1.0 --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --output json

# Should show both Org1MSP and Org2MSP as true
```

### Step 9: Commit Chaincode

```bash
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID healthcarechannel --name healthcare --version 1.0 --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
```

### Step 10: Verify Chaincode is Committed

```bash
peer lifecycle chaincode querycommitted --channelID healthcarechannel --name healthcare --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Should show: Version: 1.0, Sequence: 1, Endorsement plugin: escc, Validation plugin: vscc
```

## Part 7: Test Chaincode

### Test 1: Initialize Ledger

```bash
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C healthcarechannel -n healthcare --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"initLedger","Args":[]}'
```

### Test 2: Create Medical Record

```bash
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C healthcarechannel -n healthcare --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"createMedicalRecord","Args":["{\"recordId\":\"REC001\",\"patientId\":\"1\",\"doctorId\":\"2\",\"recordHash\":\"abc123hash\",\"timestamp\":\"2025-11-04T10:00:00Z\",\"action\":\"create\"}"]}'
```

**Important:** Wait 2-3 seconds after creating the record before querying it, to allow the transaction to be committed to the blockchain.

### Test 3: Query Medical Record

```bash
peer chaincode query -C healthcarechannel -n healthcare -c '{"function":"queryMedicalRecord","Args":["REC001"]}'
```

### Test 4: Get Record History

```bash
peer chaincode query -C healthcarechannel -n healthcare -c '{"function":"getRecordHistory","Args":["REC001"]}'
```

### Troubleshooting Test Failures

**If you get "Medical record does not exist" error:**

1. **Check if Test 2 (create) was successful:**
   - Look for "status:200" in the output
   - If you see any errors, the record wasn't created

2. **Verify chaincode logs:**
   ```bash
   # Find the chaincode container
   docker ps | grep healthcare
   
   # View logs (replace container name with actual name)
   docker logs dev-peer0.org1.example.com-healthcare_1.0-xxxxx
   ```

3. **Check if both peers endorsed the transaction:**
   - The invoke command MUST have both `--peerAddresses` (localhost:7051 and localhost:9051)
   - If only one peer is specified, the transaction may fail

4. **Re-run Test 2 with proper command:**
   ```bash
   # Make sure you're using the CORRECTED Test 2 command above
   # with BOTH peer addresses
   ```

5. **Query all records to see what exists:**
   ```bash
   peer chaincode query -C healthcarechannel -n healthcare -c '{"function":"queryAllMedicalRecords","Args":[]}'
   ```

6. **Try with a different record ID:**
   ```bash
   # Create with different ID
   peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C healthcarechannel -n healthcare --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"createMedicalRecord","Args":["{\"recordId\":\"REC002\",\"patientId\":\"1\",\"doctorId\":\"2\",\"recordHash\":\"xyz789hash\",\"timestamp\":\"2025-11-05T10:00:00Z\",\"action\":\"create\"}"]}'
   
   # Wait 2-3 seconds, then query
   peer chaincode query -C healthcarechannel -n healthcare -c '{"function":"queryMedicalRecord","Args":["REC002"]}'
   ```

## Part 8: Connect Your Node.js Application

### Option 1: Run Application on Ubuntu VM

```bash
# Clone your application
cd ~
git clone https://github.com/Katyusha47/blokcen-healthcare.git
cd blokcen-healthcare

# Install dependencies
npm install

# Install Fabric SDK
npm install fabric-network@2.2 fabric-ca-client@2.2

# Setup MySQL on Ubuntu
sudo apt install mysql-server

# IMPORTANT: Fix MySQL root password issue first
# MySQL 8.0 uses auth_socket by default, which causes issues with mysql_secure_installation

# Step 1: Connect to MySQL as root (without password)
sudo mysql

# Step 2: Inside MySQL prompt, run these commands:
# ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourStrongPassword123!';
# FLUSH PRIVILEGES;
# EXIT;

# Now run mysql_secure_installation (it will work properly now)
# When prompted for password, enter: YourStrongPassword123!
# Answer the prompts:
#   - Change root password? N (you just set it)
#   - Remove anonymous users? Y
#   - Disallow root login remotely? Y
#   - Remove test database? Y
#   - Reload privilege tables? Y

# Import database schema (use the password you set above)
mysql -u root -p < database/schema.sql
# Enter password: YourStrongPassword123!

# Create .env file
nano .env
# Add your configuration

# Start application
npm start
```

### Option 2: Connect from Windows to VM

This option allows you to run your Node.js application on Windows while connecting to the Fabric network running on Ubuntu VM.

#### Step 1: Identify Your VM IP Address

**On Ubuntu VM terminal, run:**

```bash
ip addr show
```

**Look for your main network interface (usually `enp0s3` or `eth0`):**

- **If you see `inet 192.168.x.x`** → This is a Bridged network (best for direct connection)
- **If you see `inet 10.0.2.x`** → This is NAT network (requires port forwarding)

**Example output:**
```
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
   inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic enp0s3
```

In this example, your VM IP is **`10.0.2.15`** (NAT network).

#### Step 2: Configure Port Forwarding (Required for NAT Network)

**If your VM IP is `10.0.2.x` (NAT), you MUST configure port forwarding:**

1. **Shut down your Ubuntu VM** (Power Off, not Save State)

2. **Open VirtualBox Manager**

3. **Right-click your Ubuntu VM → Settings**

4. **Go to Network → Adapter 1 → Advanced → Port Forwarding**

5. **Click the "+" icon to add new rules:**

   Add these port forwarding rules:

   | Name | Protocol | Host IP | Host Port | Guest IP | Guest Port |
   |------|----------|---------|-----------|----------|------------|
   | Peer1 | TCP | 127.0.0.1 | 7051 | 10.0.2.15 | 7051 |
   | Orderer | TCP | 127.0.0.1 | 7050 | 10.0.2.15 | 7050 |
   | Peer2 | TCP | 127.0.0.1 | 9051 | 10.0.2.15 | 9051 |
   | NodeApp | TCP | 127.0.0.1 | 3000 | 10.0.2.15 | 3000 |
   | MySQL | TCP | 127.0.0.1 | 3306 | 10.0.2.15 | 3306 |

   **Note:** Replace `10.0.2.15` with your actual VM IP if different.

6. **Click OK to save**

7. **Start your Ubuntu VM again**

**If your VM IP is `192.168.x.x` (Bridged), skip port forwarding - you can connect directly!**

#### Step 3: Copy Fabric Certificates from VM to Windows

**On Ubuntu VM terminal:**

```bash
# Navigate to test-network directory
cd ~/fabric/fabric-samples/test-network

# Create a tarball of all certificates
tar -czf organizations.tar.gz organizations/

# Check the file was created
ls -lh organizations.tar.gz
```

**Transfer the file to Windows using one of these methods:**

**Method A: Using VirtualBox Shared Folder (Easiest)**

1. On VirtualBox: VM → Devices → Shared Folders → Shared Folders Settings
2. Click "+" icon to add new shared folder
3. Folder Path: `F:\laragon\www\blokcen` (your Windows folder)
4. Folder Name: `blokcen_shared`
5. Check "Auto-mount" and "Make Permanent"
6. Click OK

On Ubuntu VM:
```bash
# Copy the tarball to shared folder
cp organizations.tar.gz /media/sf_blokcen_shared/
```

**Method B: Using SCP from Windows (if SSH is enabled)**

On Windows PowerShell:
```powershell
# If using NAT with port forwarding, SSH to localhost:22
scp -P 22 yourusername@localhost:~/fabric/fabric-samples/test-network/organizations.tar.gz F:\laragon\www\blokcen\

# If using Bridged network with direct IP
scp yourusername@10.0.2.15:~/fabric/fabric-samples/test-network/organizations.tar.gz F:\laragon\www\blokcen\
```

**Method C: Manual Copy (if shared folder works)**

Just use File Explorer to copy from the shared folder.

#### Step 4: Extract Certificates on Windows

**On Windows PowerShell:**

```powershell
cd F:\laragon\www\blokcen

# Extract the tarball (requires 7-Zip or similar)
# If you don't have tar command, use 7-Zip GUI or install Git Bash

# Using Git Bash or WSL:
tar -xzf organizations.tar.gz

# This creates: F:\laragon\www\blokcen\organizations\
```

#### Step 5: Update Connection Profile on Windows

**Edit your `fabric-network/connection-profile.json` file:**

```powershell
# Open in your editor
code F:\laragon\www\blokcen\fabric-network\connection-profile.json
```

**Update the connection profile with correct addresses:**

**If using NAT with port forwarding (10.0.2.x IP):**

```json
{
  "name": "healthcare-network",
  "version": "1.0.0",
  "client": {
    "organization": "Org1",
    "connection": {
      "timeout": {
        "peer": {
          "endorser": "300"
        },
        "orderer": "300"
      }
    }
  },
  "organizations": {
    "Org1": {
      "mspid": "Org1MSP",
      "peers": ["peer0.org1.example.com"],
      "certificateAuthorities": ["ca.org1.example.com"]
    }
  },
  "peers": {
    "peer0.org1.example.com": {
      "url": "grpcs://localhost:7051",
      "tlsCACerts": {
        "path": "organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
      },
      "grpcOptions": {
        "ssl-target-name-override": "peer0.org1.example.com",
        "hostnameOverride": "peer0.org1.example.com"
      }
    }
  },
  "orderers": {
    "orderer.example.com": {
      "url": "grpcs://localhost:7050",
      "tlsCACerts": {
        "path": "organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt"
      },
      "grpcOptions": {
        "ssl-target-name-override": "orderer.example.com",
        "hostnameOverride": "orderer.example.com"
      }
    }
  },
  "certificateAuthorities": {
    "ca.org1.example.com": {
      "url": "https://localhost:7054",
      "caName": "ca-org1",
      "tlsCACerts": {
        "path": "organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem"
      },
      "httpOptions": {
        "verify": false
      }
    }
  }
}
```

**If using Bridged network (192.168.x.x IP), replace `localhost` with your VM IP:**

```json
{
  "peers": {
    "peer0.org1.example.com": {
      "url": "grpcs://192.168.1.100:7051",
      ...
    }
  },
  "orderers": {
    "orderer.example.com": {
      "url": "grpcs://192.168.1.100:7050",
      ...
    }
  }
}
```

#### Step 6: Update Fabric Configuration in Your Application

**Edit `config/fabric.js` on Windows:**

```javascript
const path = require('path');

module.exports = {
  channelName: 'healthcarechannel',
  chaincodeName: 'healthcare',
  connectionProfile: path.resolve(__dirname, '../fabric-network/connection-profile.json'),
  
  // Update certificate paths to point to extracted organizations folder
  org1: {
    mspId: 'Org1MSP',
    walletPath: path.resolve(__dirname, '../wallet'),
    // Path to admin user cert
    certPath: path.resolve(__dirname, '../organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts'),
    // Path to admin user private key
    keyPath: path.resolve(__dirname, '../organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore')
  }
};
```

#### Step 7: Test Connection from Windows

**On Windows PowerShell:**

```powershell
cd F:\laragon\www\blokcen

# Install dependencies if not already installed
npm install

# Install Fabric SDK
npm install fabric-network@2.2 fabric-ca-client@2.2

# Test connection with a simple script
node -e "const { Gateway } = require('fabric-network'); console.log('Fabric SDK loaded successfully');"
```

#### Step 8: Test Network Connectivity

**On Windows PowerShell, test if ports are accessible:**

```powershell
# Test Peer connection (should timeout if working, error if port closed)
Test-NetConnection -ComputerName localhost -Port 7051

# Test Orderer connection
Test-NetConnection -ComputerName localhost -Port 7050

# Test Peer2 connection
Test-NetConnection -ComputerName localhost -Port 9051
```

**Expected output:** `TcpTestSucceeded : True` for each port

#### Step 9: Start Your Application on Windows

```powershell
cd F:\laragon\www\blokcen

# Make sure MySQL is running on Windows (Laragon)
# Start Laragon if not running

# Start your Node.js application
npm start
```

Your application should now connect to the Fabric network running on Ubuntu VM!

#### Troubleshooting Connection Issues

**Issue: "Failed to connect to peer"**

1. **Check if port forwarding is correct:**
   ```powershell
   # On Windows
   Test-NetConnection localhost -Port 7051
   ```

2. **Check if Fabric network is running on Ubuntu:**
   ```bash
   # On Ubuntu VM
   docker ps
   # Should show peer0.org1.example.com, peer0.org2.example.com, orderer.example.com
   ```

3. **Check Ubuntu firewall:**
   ```bash
   # On Ubuntu VM
   sudo ufw status
   
   # If active, allow the ports
   sudo ufw allow 7050
   sudo ufw allow 7051
   sudo ufw allow 9051
   ```

**Issue: "Certificate validation failed"**

- Make sure certificate paths in connection-profile.json are correct
- Paths should be relative to your project root: `organizations/peerOrganizations/...`

**Issue: "Timeout connecting to peer"**

- Increase timeout values in connection-profile.json
- Check if VM is accessible from Windows: `ping localhost` (for NAT) or `ping 192.168.x.x` (for Bridged)

#### Summary - What You Need

**Your VM IP address:** `10.0.2.15` (from your screenshot)

**Network Type:** NAT (10.0.2.x means NAT network)

**Required Actions:**
1. ✅ Configure port forwarding in VirtualBox (7050, 7051, 9051)
2. ✅ Copy certificates from VM to Windows
3. ✅ Update connection-profile.json to use `localhost` (because of port forwarding)
4. ✅ Test connectivity from Windows
5. ✅ Run your application on Windows

**Connection URLs (for NAT with port forwarding):**
- Peer: `grpcs://localhost:7051`
- Orderer: `grpcs://localhost:7050`
- Peer2: `grpcs://localhost:9051`

## Part 9: Automated Setup Script

Create this script for easy setup:

```bash
# Save as setup-fabric.sh
nano ~/setup-fabric.sh
```

Paste this content:

```bash
#!/bin/bash

echo "======================================="
echo "Hyperledger Fabric Setup for Healthcare"
echo "======================================="
echo ""

# Update system
echo "[1/8] Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "[2/8] Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Node.js
echo "[3/8] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install prerequisites
echo "[4/8] Installing prerequisites..."
sudo apt install -y curl git python3 python3-pip build-essential

# Download Fabric
echo "[5/8] Downloading Fabric (this may take 10-15 minutes)..."
mkdir -p ~/fabric
cd ~/fabric
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5

# Configure PATH
echo "[6/8] Configuring PATH..."
echo 'export PATH=$PATH:~/fabric/fabric-samples/bin' >> ~/.bashrc
export PATH=$PATH:~/fabric/fabric-samples/bin

# Start network
echo "[7/8] Starting Fabric network..."
cd ~/fabric/fabric-samples/test-network
./network.sh down
./network.sh up createChannel -c healthcarechannel -ca

# Verify
echo "[8/8] Verifying installation..."
docker ps

echo ""
echo "Setup complete!"
echo "Next steps:"
echo "1. Copy your chaincode to: ~/fabric/fabric-samples/chaincode/healthcare"
echo "2. Deploy chaincode using the deployment steps"
echo "3. Test your chaincode"
echo ""
```

Make it executable and run:

```bash
chmod +x ~/setup-fabric.sh
./setup-fabric.sh
```

## Useful Commands

### Network Management

```bash
# Stop network
./network.sh down

# Start network
./network.sh up createChannel -c healthcarechannel -ca

# View logs
docker logs peer0.org1.example.com -f

# View all containers
docker ps -a

# Clean everything
./network.sh down
docker system prune -a --volumes
```

### Chaincode Management

```bash
# View chaincode logs
docker logs -f dev-peer0.org1.example.com-healthcare_1.0

# Reinstall chaincode (after changes)
# Package → Install → Approve → Commit (with new sequence number)
```

## Troubleshooting

### Issue: "docker.service does not exist" or Docker not installed

**Docker installation failed or incomplete:**

```bash
# Completely remove any partial Docker installation
sudo apt remove docker docker-engine docker.io containerd runc
sudo apt autoremove

# Install Docker using the official convenience script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Check Docker status
sudo systemctl status docker

# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Test Docker
docker run hello-world
```

### Issue: "Docker is required to be running" or "Cannot connect to Docker daemon"

**This is the most common issue!**

```bash
# Step 1: Check if Docker is installed
docker --version

# Step 2: Check if Docker service is running
sudo systemctl status docker

# Step 3: Start Docker if not running
sudo systemctl start docker
sudo systemctl enable docker

# Step 4: Add user to docker group (CRITICAL!)
sudo usermod -aG docker $USER

# Step 5: Apply group changes - MUST DO ONE OF THESE:
# Option A: Use newgrp (temporary for current terminal)
newgrp docker

# Option B: Logout and login again (permanent)
# Just close terminal and open a new one

# Step 6: Verify Docker works without sudo
docker ps
docker run hello-world

# If still getting errors, reboot the VM
sudo reboot
```

### Issue: "peer: command not found"

```bash
export PATH=$PATH:~/fabric/fabric-samples/bin
# Or add to ~/.bashrc permanently
```

### Issue: Network fails to start

```bash
./network.sh down
docker system prune -a --volumes
./network.sh up createChannel -c healthcarechannel -ca
```

### Issue: Port already in use

```bash
# Find and kill process
sudo lsof -i :7051
sudo kill -9 <PID>
```

### Issue: "make sure you have jq installed"

**Missing jq (JSON processor):**

```bash
# Install jq
sudo apt update
sudo apt install -y jq

# Verify installation
jq --version

# Now try starting the network again
cd ~/fabric/fabric-samples/test-network
./network.sh down
./network.sh up createChannel -c healthcarechannel -ca
```

## Performance Tips

1. **Allocate enough RAM**: 8GB recommended for VM
2. **Use SSD**: Faster disk = faster blockchain
3. **Enable hardware virtualization**: In BIOS/UEFI
4. **Bridge network**: Better performance than NAT
5. **Close unnecessary apps**: Free up resources

## Security Notes

For production:
- Use proper certificates
- Configure firewall
- Use strong passwords
- Enable TLS everywhere
- Regular backups
- Monitor logs

## Summary

Ubuntu VM setup advantages:
- **Faster**: Native Linux performance
- **Easier**: Better package management
- **More stable**: Fewer compatibility issues
- **Cleaner**: Separate environment
- **Production-like**: Real-world scenario

Your Fabric network is now running on Ubuntu VM and ready to integrate with your healthcare blockchain application!

## Next Steps

1. Deploy your chaincode
2. Test all functions
3. Connect your Node.js application
4. Monitor performance
5. Set up backups

Need help? Check the logs:
```bash
docker logs peer0.org1.example.com
docker logs orderer.example.com
```
