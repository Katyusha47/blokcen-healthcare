First, Check What's Actually Running:

```bash
# On Lubuntu:

# 1. Check Docker containers and their ports
docker ps --format "table {{.Names}}\t{{.Ports}}"

# 2. Check if ports are listening
netstat -tuln | grep -E '7050|7051|9051'

# 3. Check peer logs to see TLS status
docker logs peer0.org1.example.com 2>&1 | grep -i tls | head -10
```

Most Likely: Network is NOT Running with TLS

```bash
# On Lubuntu:

# 1. Stop everything
cd ~/fabric/fabric-samples/test-network
./network.sh down

# 2. Clean Docker
docker system prune -f

# 3. Start network WITHOUT CA (CA mode has issues with TLS)
./network.sh up createChannel -c healthcarechannel

# 4. Deploy chaincode
./network.sh deployCC -ccn healthcare -ccp ~/blokcen-healthcare/fabric-network/chaincode -ccl javascript -c healthcarechannel

# 5. Verify chaincode deployed
docker exec peer0.org1.example.com peer lifecycle chaincode querycommitted -C healthcarechannel
```

Then Update Connection Profile to Match:

```bash
nano ~/blokcen-healthcare/fabric-network/connection-profile.json
```

Use this simpler version that matches test-network defaults:

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
      "peers": ["peer0.org1.example.com"]
    }
  },
  "peers": {
    "peer0.org1.example.com": {
      "url": "grpcs://localhost:7051",
      "grpcOptions": {
        "ssl-target-name-override": "peer0.org1.example.com",
        "hostnameOverride": "peer0.org1.example.com",
        "grpc.keepalive_time_ms": 120000,
        "grpc.http2.min_time_between_pings_ms": 120000,
        "grpc.keepalive_timeout_ms": 20000,
        "grpc.http2.max_pings_without_data": 0,
        "grpc.keepalive_permit_without_calls": 1
      }
    }
  },
  "orderers": {
    "orderer.example.com": {
      "url": "grpcs://localhost:7050",
      "grpcOptions": {
        "ssl-target-name-override": "orderer.example.com",
        "hostnameOverride": "orderer.example.com",
        "grpc.keepalive_time_ms": 120000,
        "grpc.http2.min_time_between_pings_ms": 120000,
        "grpc.keepalive_timeout_ms": 20000,
        "grpc.http2.max_pings_without_data": 0,
        "grpc.keepalive_permit_without_calls": 1
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

Update fabric.js loadConnectionProfile Function:

```bash
loadConnectionProfile() {
  const ccpPath = path.resolve(__dirname, '..', 'fabric-network', 'connection-profile.json');
  const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
  const ccp = JSON.parse(ccpJSON);

  // Load TLS certificates with absolute paths
  const orgPath = path.resolve(__dirname, '..', 'organizations');
  
  // Peer TLS cert
  const peerTLSPath = path.join(orgPath, 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
  if (fs.existsSync(peerTLSPath)) {
    console.log('✅ Loading peer TLS cert');
    ccp.peers['peer0.org1.example.com'].tlsCACerts = {
      pem: fs.readFileSync(peerTLSPath, 'utf8')
    };
  } else {
    console.error('❌ Peer TLS cert not found:', peerTLSPath);
  }

  // Orderer TLS cert
  const ordererTLSPath = path.join(orgPath, 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem');
  if (fs.existsSync(ordererTLSPath)) {
    console.log('✅ Loading orderer TLS cert');
    ccp.orderers['orderer.example.com'].tlsCACerts = {
      pem: fs.readFileSync(ordererTLSPath, 'utf8')
    };
  } else {
    console.error('❌ Orderer TLS cert not found:', ordererTLSPath);
  }

  return ccp;
}
```

Restart Everything:

```bash
# Copy fresh certificates
cd ~/blokcen-healthcare
rm -rf wallet organizations
cp -r ~/fabric/fabric-samples/test-network/organizations ./

# Verify certs exist
ls organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
ls organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Start app
npm start
```