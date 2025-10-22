# Complete Hyperledger Fabric Setup Guide for Windows

## Prerequisites

Before starting, ensure you have:
- Windows 10/11 (64-bit)
- At least 8GB RAM
- 20GB free disk space
- Administrator access

## Step 1: Install Required Software

### 1.1 Install Git for Windows

1. Download from: https://git-scm.com/download/win
2. Run installer with default settings
3. Verify installation:
```powershell
git --version
```

### 1.2 Install Docker Desktop for Windows

1. Download from: https://www.docker.com/products/docker-desktop
2. Install Docker Desktop
3. Start Docker Desktop
4. In Docker settings:
   - Enable WSL 2 backend (recommended)
   - Allocate at least 4GB RAM
   - Allocate at least 2 CPUs
5. Verify installation:
```powershell
docker --version
docker-compose --version
```

### 1.3 Install Node.js (v14 or v16)

1. Download from: https://nodejs.org/en/download/
2. Install LTS version (16.x recommended)
3. Verify installation:
```powershell
node --version
npm --version
```

### 1.4 Install Python (for npm modules)

1. Download Python 3.8+: https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Verify:
```powershell
python --version
```

### 1.5 Install Visual Studio Build Tools (for Windows)

```powershell
npm install --global windows-build-tools
```

OR download from: https://visualstudio.microsoft.com/downloads/
- Install "Desktop development with C++"

## Step 2: Download Hyperledger Fabric

### 2.1 Create Fabric Directory

```powershell
# Create a directory for Fabric
mkdir F:\fabric
cd F:\fabric
```

### 2.2 Download Fabric Samples and Binaries

```powershell
# Download fabric samples (this also downloads binaries)
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.0 1.5.5

# If curl doesn't work, use this alternative:
# Download manually from: https://github.com/hyperledger/fabric/releases
```

This will download:
- Fabric samples repository
- Fabric binaries (peer, orderer, configtxgen, etc.)
- Fabric Docker images

### 2.3 Add Fabric Binaries to PATH

```powershell
# Add to system PATH (permanent)
$env:Path += ";F:\fabric\fabric-samples\bin"

# Or add manually:
# Right-click "This PC" → Properties → Advanced System Settings
# → Environment Variables → Path → Edit → New
# Add: F:\fabric\fabric-samples\bin
```

Verify:
```powershell
peer version
orderer version
```

## Step 3: Start Fabric Test Network

### 3.1 Navigate to Test Network

```powershell
cd F:\fabric\fabric-samples\test-network
```

### 3.2 Clean Any Previous Network

```powershell
./network.sh down
```

### 3.3 Start the Network

```powershell
# Start network with CA (Certificate Authority)
./network.sh up createChannel -c healthcarechannel -ca
```

This will:
- Start Docker containers for orderer and peers
- Create a channel named "healthcarechannel"
- Join peers to the channel

Verify containers are running:
```powershell
docker ps
```

You should see containers:
- orderer.example.com
- peer0.org1.example.com
- peer0.org2.example.com
- ca_org1
- ca_org2

## Step 4: Prepare Your Chaincode

### 4.1 Copy Your Chaincode

```powershell
# Create chaincode directory in fabric-samples
mkdir F:\fabric\fabric-samples\chaincode\healthcare

# Copy your chaincode files
Copy-Item -Path "F:\laragon\www\blokcen\fabric-network\chaincode\*" -Destination "F:\fabric\fabric-samples\chaincode\healthcare" -Recurse
```

### 4.2 Verify Chaincode Files

```powershell
cd F:\fabric\fabric-samples\chaincode\healthcare
ls
```

You should see:
- medicalRecords.js
- package.json

## Step 5: Deploy Chaincode to Network

### 5.1 Package the Chaincode

```powershell
cd F:\fabric\fabric-samples\test-network

# Package chaincode
peer lifecycle chaincode package healthcare.tar.gz --path ../chaincode/healthcare --lang node --label healthcare_1.0
```

### 5.2 Install Chaincode on Org1 Peer

```powershell
# Set environment for Org1
$env:CORE_PEER_TLS_ENABLED="true"
$env:CORE_PEER_LOCALMSPID="Org1MSP"
$env:CORE_PEER_TLS_ROOTCERT_FILE="F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\peers\peer0.org1.example.com\tls\ca.crt"
$env:CORE_PEER_MSPCONFIGPATH="F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\users\Admin@org1.example.com\msp"
$env:CORE_PEER_ADDRESS="localhost:7051"

# Install chaincode
peer lifecycle chaincode install healthcare.tar.gz
```

### 5.3 Install Chaincode on Org2 Peer

```powershell
# Set environment for Org2
$env:CORE_PEER_LOCALMSPID="Org2MSP"
$env:CORE_PEER_TLS_ROOTCERT_FILE="F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\peers\peer0.org2.example.com\tls\ca.crt"
$env:CORE_PEER_MSPCONFIGPATH="F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\users\Admin@org2.example.com\msp"
$env:CORE_PEER_ADDRESS="localhost:9051"

# Install chaincode
peer lifecycle chaincode install healthcare.tar.gz
```

### 5.4 Query Installed Chaincode (Get Package ID)

```powershell
peer lifecycle chaincode queryinstalled
```

Copy the Package ID (looks like: healthcare_1.0:abc123...)

### 5.5 Approve Chaincode for Org1

```powershell
# Set back to Org1
$env:CORE_PEER_LOCALMSPID="Org1MSP"
$env:CORE_PEER_TLS_ROOTCERT_FILE="F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\peers\peer0.org1.example.com\tls\ca.crt"
$env:CORE_PEER_MSPCONFIGPATH="F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\users\Admin@org1.example.com\msp"
$env:CORE_PEER_ADDRESS="localhost:7051"

# Approve (replace PACKAGE_ID with actual ID from previous step)
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID healthcarechannel --name healthcare --version 1.0 --package-id healthcare_1.0:REPLACE_WITH_PACKAGE_ID --sequence 1 --tls --cafile "F:\fabric\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem"
```

### 5.6 Approve Chaincode for Org2

```powershell
# Set to Org2
$env:CORE_PEER_LOCALMSPID="Org2MSP"
$env:CORE_PEER_TLS_ROOTCERT_FILE="F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\peers\peer0.org2.example.com\tls\ca.crt"
$env:CORE_PEER_MSPCONFIGPATH="F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\users\Admin@org2.example.com\msp"
$env:CORE_PEER_ADDRESS="localhost:9051"

# Approve (use same PACKAGE_ID)
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID healthcarechannel --name healthcare --version 1.0 --package-id healthcare_1.0:REPLACE_WITH_PACKAGE_ID --sequence 1 --tls --cafile "F:\fabric\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem"
```

### 5.7 Check Commit Readiness

```powershell
peer lifecycle chaincode checkcommitreadiness --channelID healthcarechannel --name healthcare --version 1.0 --sequence 1 --tls --cafile "F:\fabric\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem" --output json
```

Should show both orgs approved.

### 5.8 Commit Chaincode

```powershell
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID healthcarechannel --name healthcare --version 1.0 --sequence 1 --tls --cafile "F:\fabric\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem" --peerAddresses localhost:7051 --tlsRootCertFiles "F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\peers\peer0.org1.example.com\tls\ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\peers\peer0.org2.example.com\tls\ca.crt"
```

### 5.9 Verify Chaincode is Committed

```powershell
peer lifecycle chaincode querycommitted --channelID healthcarechannel --name healthcare --cafile "F:\fabric\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem"
```

## Step 6: Test Your Chaincode

### 6.1 Initialize Ledger

```powershell
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "F:\fabric\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem" -C healthcarechannel -n healthcare --peerAddresses localhost:7051 --tlsRootCertFiles "F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\peers\peer0.org1.example.com\tls\ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\peers\peer0.org2.example.com\tls\ca.crt" -c '{"function":"initLedger","Args":[]}'
```

### 6.2 Test Create Medical Record

```powershell
$recordData = '{"recordId":"REC001","patientId":"1","doctorId":"2","recordHash":"abc123","timestamp":"2025-10-22T10:00:00Z","action":"create"}'

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "F:\fabric\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem" -C healthcarechannel -n healthcare --peerAddresses localhost:7051 --tlsRootCertFiles "F:\fabric\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\peers\peer0.org1.example.com\tls\ca.crt" -c "{\"function\":\"createMedicalRecord\",\"Args\":[\"$recordData\"]}"
```

### 6.3 Test Query Medical Record

```powershell
peer chaincode query -C healthcarechannel -n healthcare -c '{"function":"queryMedicalRecord","Args":["REC001"]}'
```

## Step 7: Configure Your Application

### 7.1 Update Connection Profile

Create `F:\laragon\www\blokcen\fabric-network\connection-org1.json`:

```json
{
    "name": "healthcare-network-org1",
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
            "peers": [
                "peer0.org1.example.com"
            ],
            "certificateAuthorities": [
                "ca.org1.example.com"
            ]
        }
    },
    "peers": {
        "peer0.org1.example.com": {
            "url": "grpcs://localhost:7051",
            "tlsCACerts": {
                "path": "F:\\fabric\\fabric-samples\\test-network\\organizations\\peerOrganizations\\org1.example.com\\peers\\peer0.org1.example.com\\tls\\ca.crt"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.org1.example.com",
                "hostnameOverride": "peer0.org1.example.com"
            }
        }
    },
    "certificateAuthorities": {
        "ca.org1.example.com": {
            "url": "https://localhost:7054",
            "caName": "ca-org1",
            "tlsCACerts": {
                "path": "F:\\fabric\\fabric-samples\\test-network\\organizations\\peerOrganizations\\org1.example.com\\ca\\ca.org1.example.com-cert.pem"
            },
            "httpOptions": {
                "verify": false
            }
        }
    }
}
```

### 7.2 Update Your Application's Fabric Config

Edit `F:\laragon\www\blokcen\config\fabric.js`:

```javascript
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

class FabricConnection {
  constructor() {
    this.gateway = null;
    this.wallet = null;
    this.connected = false;
  }

  async connect() {
    try {
      // Load connection profile
      const ccpPath = path.resolve(__dirname, '..', 'fabric-network', 'connection-org1.json');
      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

      // Create wallet
      const walletPath = path.join(process.cwd(), 'wallet');
      this.wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check if admin identity exists
      const identity = await this.wallet.get('admin');
      if (!identity) {
        console.log('Admin identity not found. Enrolling admin...');
        await this.enrollAdmin(ccp);
      }

      // Create gateway
      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet: this.wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
      });

      this.connected = true;
      console.log('Connected to Fabric network successfully');
      return true;
    } catch (error) {
      console.error('Failed to connect to Fabric network:', error);
      this.connected = false;
      return false;
    }
  }

  async enrollAdmin(ccp) {
    try {
      const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
      const caTLSCACerts = fs.readFileSync(caInfo.tlsCACerts.path, 'utf8');
      const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

      const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
      };

      await this.wallet.put('admin', x509Identity);
      console.log('Successfully enrolled admin user and imported it into the wallet');
    } catch (error) {
      console.error('Failed to enroll admin user:', error);
      throw error;
    }
  }

  async submitTransaction(contractName, functionName, ...args) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      const network = await this.gateway.getNetwork('healthcarechannel');
      const contract = network.getContract(contractName);
      const result = await contract.submitTransaction(functionName, ...args);
      
      return result.toString();
    } catch (error) {
      console.error('Transaction submission failed:', error);
      throw error;
    }
  }

  async evaluateTransaction(contractName, functionName, ...args) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      const network = await this.gateway.getNetwork('healthcarechannel');
      const contract = network.getContract(contractName);
      const result = await contract.evaluateTransaction(functionName, ...args);
      
      return result.toString();
    } catch (error) {
      console.error('Transaction evaluation failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.gateway) {
      await this.gateway.disconnect();
      this.connected = false;
    }
  }
}

module.exports = new FabricConnection();
```

### 7.3 Install Fabric SDK Dependencies

```powershell
cd F:\laragon\www\blokcen

npm install fabric-network@2.2 fabric-ca-client@2.2
```

## Step 8: Start Your Application

### 8.1 Verify Everything is Running

```powershell
# Check Docker containers
docker ps

# Should see:
# - orderer.example.com
# - peer0.org1.example.com
# - peer0.org2.example.com
# - ca_org1
# - ca_org2
```

### 8.2 Start Your Node.js Application

```powershell
cd F:\laragon\www\blokcen
npm start
```

### 8.3 Test the Application

1. Open browser: http://localhost:3000
2. Login as doctor
3. Create a medical record
4. Check the terminal logs - should see Fabric transactions

## Step 9: Useful Commands

### Check Chaincode Logs

```powershell
docker logs -f dev-peer0.org1.example.com-healthcare_1.0
```

### Stop the Network

```powershell
cd F:\fabric\fabric-samples\test-network
./network.sh down
```

### Restart the Network

```powershell
./network.sh down
./network.sh up createChannel -c healthcarechannel -ca
# Then redeploy chaincode (Steps 5.1 - 5.8)
```

### View All Docker Containers

```powershell
docker ps -a
```

### Clean Everything

```powershell
cd F:\fabric\fabric-samples\test-network
./network.sh down
docker system prune -a --volumes
```

## Troubleshooting

### Issue: "peer: command not found"

**Solution:** Add Fabric binaries to PATH:
```powershell
$env:Path += ";F:\fabric\fabric-samples\bin"
```

### Issue: "Docker not running"

**Solution:** 
1. Start Docker Desktop
2. Wait until Docker is fully running
3. Try again

### Issue: "Cannot connect to Docker daemon"

**Solution:**
1. Open Docker Desktop
2. Settings → Resources → WSL Integration
3. Enable integration with your distro
4. Restart Docker Desktop

### Issue: "Chaincode installation failed"

**Solution:**
1. Check chaincode syntax: `cd F:\fabric\fabric-samples\chaincode\healthcare && npm install`
2. Verify package.json exists
3. Check Docker logs: `docker logs peer0.org1.example.com`

### Issue: "Channel creation failed"

**Solution:**
```powershell
./network.sh down
docker volume prune
./network.sh up createChannel -c healthcarechannel
```

### Issue: "Transaction timeout"

**Solution:**
1. Increase timeout in connection profile
2. Check network connectivity: `docker network ls`
3. Restart Docker

## Architecture Overview

```
Your Application (Node.js)
    ↓
Fabric SDK
    ↓
Gateway → Network → Channel (healthcarechannel)
                        ↓
                    Contract (healthcare)
                        ↓
                    Chaincode Functions
                        ↓
                Distributed Ledger
                    ↓
        Peer0.Org1 ← Orderer → Peer0.Org2
```

## Security Notes

1. **In Production:**
   - Generate proper certificates (not using test-network)
   - Use real Certificate Authority
   - Enable proper TLS
   - Secure wallet storage
   - Use environment variables for sensitive data

2. **For Development:**
   - Current setup is fine for testing
   - Network runs on localhost
   - Uses test certificates

## Next Steps

1. Test all chaincode functions
2. Integrate with your Node.js backend
3. Add error handling
4. Implement proper user enrollment
5. Add multiple organizations (if needed)
6. Monitor blockchain performance
7. Set up production network (when ready)

## Resources

- Hyperledger Fabric Docs: https://hyperledger-fabric.readthedocs.io/
- Fabric Samples: https://github.com/hyperledger/fabric-samples
- Node SDK: https://hyperledger.github.io/fabric-sdk-node/

## Summary

You now have:
- Hyperledger Fabric network running
- Your chaincode deployed
- Application connected to blockchain
- Medical records stored immutably
- Complete audit trail

Your healthcare blockchain system is fully operational!
