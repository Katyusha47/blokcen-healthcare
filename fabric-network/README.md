# Healthcare Blockchain - Hyperledger Fabric Network Setup

## ⚠️ Important Prerequisites

Before running this Fabric network, you need:

1. **Docker & Docker Compose** installed
2. **Hyperledger Fabric binaries** (peer, orderer, etc.)
3. **Hyperledger Fabric Docker images**

## Quick Setup for Development

Since setting up a full Hyperledger Fabric network requires Docker and complex configuration, here are your options:

### Option 1: Use Fabric Test Network (Recommended for Development)

```bash
# Clone Fabric Samples
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples/test-network

# Start the network
./network.sh up createChannel -c healthcarechannel

# Deploy chaincode
./network.sh deployCC -ccn medicalrecords -ccp ../../blokcen/fabric-network/chaincode -ccl javascript
```

### Option 2: Mock Blockchain for Testing

For quick testing without Fabric setup, you can:

1. Comment out blockchain calls in `config/fabric.js`
2. The system will work with just MySQL database
3. Blockchain integration can be added later

### Option 3: Use Hyperledger Fabric as a Service

Consider using:
- IBM Blockchain Platform
- Oracle Blockchain Cloud Service
- Azure Blockchain Service

## Current Setup

The provided files include:
- ✅ Chaincode (`chaincode/medicalRecords.js`)
- ✅ Connection profile
- ✅ Startup script template
- ⚠️ Requires Docker Compose configuration

## For Production

You'll need to create:
1. `docker-compose.yaml` - Network topology
2. Crypto materials (certificates)
3. Channel configuration
4. Genesis block

Refer to official Hyperledger Fabric documentation:
https://hyperledger-fabric.readthedocs.io/

## Testing Without Fabric

The application is designed to gracefully handle Fabric connection failures. Medical records will still be stored in MySQL with hash validation.
