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
peer lifecycle chaincode package healthcare.tar.gz \
  --path ../chaincode/healthcare \
  --lang node \
  --label healthcare_1.0

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
peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID healthcarechannel \
  --name healthcare \
  --version 1.0 \
  --package-id $CC_PACKAGE_ID \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
```

### Step 7: Approve Chaincode for Org2

```bash
# Switch to Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

# Approve
peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID healthcarechannel \
  --name healthcare \
  --version 1.0 \
  --package-id $CC_PACKAGE_ID \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
```

### Step 8: Check Commit Readiness

```bash
peer lifecycle chaincode checkcommitreadiness \
  --channelID healthcarechannel \
  --name healthcare \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --output json

# Should show both Org1MSP and Org2MSP as true
```

### Step 9: Commit Chaincode

```bash
peer lifecycle chaincode commit -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID healthcarechannel \
  --name healthcare \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
```

### Step 10: Verify Chaincode is Committed

```bash
peer lifecycle chaincode querycommitted \
  --channelID healthcarechannel \
  --name healthcare \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

# Should show: Version: 1.0, Sequence: 1, Endorsement plugin: escc, Validation plugin: vscc
```

## Part 7: Test Chaincode

### Test 1: Initialize Ledger

```bash
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C healthcarechannel \
  -n healthcare \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"initLedger","Args":[]}'
```

### Test 2: Create Medical Record

```bash
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C healthcarechannel \
  -n healthcare \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  -c '{"function":"createMedicalRecord","Args":["{\"recordId\":\"REC001\",\"patientId\":\"1\",\"doctorId\":\"2\",\"recordHash\":\"abc123hash\",\"timestamp\":\"2025-11-04T10:00:00Z\",\"action\":\"create\"}"]}'
```

### Test 3: Query Medical Record

```bash
peer chaincode query \
  -C healthcarechannel \
  -n healthcare \
  -c '{"function":"queryMedicalRecord","Args":["REC001"]}'
```

### Test 4: Get Record History

```bash
peer chaincode query \
  -C healthcarechannel \
  -n healthcare \
  -c '{"function":"getRecordHistory","Args":["REC001"]}'
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
sudo mysql_secure_installation

# Import database schema
mysql -u root -p < database/schema.sql

# Create .env file
nano .env
# Add your configuration

# Start application
npm start
```

### Option 2: Connect from Windows to VM

**On Ubuntu VM:**

1. Get VM IP address:
```bash
ip addr show
# Look for inet 192.168.x.x
```

2. Configure port forwarding (if using NAT):
   - VirtualBox → Settings → Network → Port Forwarding
   - Add rules:
     - 7051 → 7051 (Peer)
     - 7050 → 7050 (Orderer)
     - 9051 → 9051 (Peer2)

3. Copy certificates to Windows:
```bash
# On Ubuntu, create a tarball
cd ~/fabric/fabric-samples/test-network
tar -czf organizations.tar.gz organizations/

# Transfer to Windows using SCP or shared folder
```

**On Windows:**

Update connection profile with VM IP address:

```json
{
  "peers": {
    "peer0.org1.example.com": {
      "url": "grpcs://VM_IP_ADDRESS:7051",
      ...
    }
  }
}
```

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
