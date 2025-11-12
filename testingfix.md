# On Lubuntu:

# 1. Stop your app (Ctrl+C)

# 2. Completely destroy and recreate the network
cd ~/fabric/fabric-samples/test-network
./network.sh down
docker volume prune -f
docker network prune -f

# 3. Start fresh network with BOTH orgs
./network.sh up createChannel -c healthcarechannel -ca

# 4. IMPORTANT: Check if channel was created successfully
docker exec peer0.org1.example.com peer channel list

# Should show:
# Channels peers has joined:
# healthcarechannel

# 5. Deploy chaincode again
./network.sh deployCC -ccn healthcare -ccp ~/blokcen-healthcare/fabric-network/chaincode -ccl javascript -c healthcarechannel

# Wait for deployment to finish completely
sleep 15

# 6. Test if chaincode works from peer
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer chaincode query -C healthcarechannel -n healthcare -c '{"Args":["queryAllMedicalRecords"]}'

# 7. If query works, copy fresh certs to your app
cd ~/blokcen-healthcare
rm -rf wallet organizations
cp -r ~/fabric/fabric-samples/test-network/organizations ./

# 8. Start your app
npm start

# 1. Verify both peers joined the channel
docker exec peer0.org1.example.com peer channel list
docker exec peer0.org2.example.com peer channel list

# Both should show "healthcarechannel"

# 2. Check chaincode is installed on both peers
docker exec peer0.org1.example.com peer lifecycle chaincode queryinstalled
docker exec peer0.org2.example.com peer lifecycle chaincode queryinstalled

# 3. Check chaincode is committed to channel
docker exec peer0.org1.example.com peer lifecycle chaincode querycommitted -C healthcarechannel

# Should show healthcare chaincode

nano ~/blokcen-healthcare/config/fabric.js

await this.gateway.connect(ccp, {
  wallet: this.wallet,
  identity: 'admin',
  discovery: { 
    enabled: false,  // ← Disable discovery
    asLocalhost: true
  }
});


# Check channel
docker exec peer0.org1.example.com peer channel list

# Check chaincode
docker exec peer0.org1.example.com peer lifecycle chaincode querycommitted -C healthcarechannel

# On Lubuntu, in test-network directory:
cd ~/fabric/fabric-samples/test-network

# Set CORRECT environment variables with TLS ENABLED
```bash
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export FABRIC_CFG_PATH=${PWD}/../config/
```

# Now try the query with --tls flag
```bash
peer chaincode query -C healthcarechannel -n healthcare -c '{"Args":["queryAllMedicalRecords"]}' --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

# Much easier - use the setEnv script
```bash
cd ~/fabric/fabric-samples/test-network
```

# Source the environment for Org1
```bash
. ./scripts/envVar.sh
setGlobals 1
```

# Now query
```bash
peer chaincode query -C healthcarechannel -n healthcare -c '{"Args":["queryAllMedicalRecords"]}'
```

# test
# On Lubuntu:

# 1. Check if chaincode is actually committed
```bash
cd ~/fabric/fabric-samples/test-network
. ./scripts/envVar.sh
setGlobals 1
```

```bash
peer lifecycle chaincode querycommitted -C healthcarechannel
```

# This should show "healthcare" chaincode
# If NOT showing, chaincode wasn't deployed!

# Check your chaincode file
```bash
cat ~/blokcen-healthcare/fabric-network/chaincode/medicalRecords.js | grep "async query"
```

# Make sure the function is named exactly: queryAllMedicalRecords

```bash
cd ~/fabric/fabric-samples/test-network
```

# 1. Check where your chaincode actually is
```bash
ls -la ~/blokcen-healthcare/fabric-network/chaincode/
```

# Should show medicalRecords.js and package.json

# 2. Redeploy chaincode with ABSOLUTE path
```bash
./network.sh deployCC -ccn healthcare -ccp ~/blokcen-healthcare/fabric-network/chaincode -ccl javascript -c healthcarechannel
```
# Wait for it to finish completely (can take 30-60 seconds)

# 3. Verify deployment
```bash
peer lifecycle chaincode querycommitted -C healthcarechannel -n healthcare
```
# Should show:
# Committed chaincode definition for chaincode 'healthcare' on channel 'healthcarechannel':
# Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc


# fixed

```bash
nano ~/blokcen-healthcare/fabric-network/connection-profile.json
```

```bash
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
  "channels": {
    "healthcarechannel": {
      "orderers": ["orderer.example.com"],
      "peers": {
        "peer0.org1.example.com": {
          "endorsingPeer": true,
          "chaincodeQuery": true,
          "ledgerQuery": true,
          "eventSource": true
        }
      }
    }
  }
}
```

```bash
# 1. Test if chaincode works with correct TLS settings
cd ~/fabric/fabric-samples/test-network
. ./scripts/envVar.sh
setGlobals 1
peer chaincode query -C healthcarechannel -n healthcare -c '{"Args":["queryAllMedicalRecords"]}'

# 2. If that works, update your app's connection profile (see above)

# 3. Delete wallet
cd ~/blokcen-healthcare
rm -rf wallet

# 4. Update fabric.js to use TLS
nano config/fabric.js

# In the gateway.connect section, make sure it has:
# discovery: { enabled: true, asLocalhost: true }

# 5. Start your app
npm start
```