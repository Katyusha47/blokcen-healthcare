const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

class FabricConnection {
  constructor() {
    this.gateway = null;
    this.wallet = null;
    this.network = null;
    this.contract = null;
    this.isConnected = false;
  }

  _injectTlsCerts(ccp) {
    // Load TLS CA certs from organizations folder and attach PEM strings to ccp
    try {
      const orgsBase = path.join(__dirname, '..', 'organizations');

      // peer0.org1 - only attach if peer entry already exists in the CCP
      const peer1Tls = path.join(orgsBase, 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
      if (fs.existsSync(peer1Tls)) {
        const pem = fs.readFileSync(peer1Tls, 'utf8');
        if (ccp.peers && ccp.peers['peer0.org1.example.com']) {
          ccp.peers['peer0.org1.example.com'].tlsCACerts = { pem };
        } else {
          console.warn('⚠️  CCP has no entry for peer0.org1.example.com — skipping TLS injection for this peer');
        }
      }

      // peer0.org2 (if exists)
      const peer2Tls = path.join(orgsBase, 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');
      if (fs.existsSync(peer2Tls)) {
        const pem = fs.readFileSync(peer2Tls, 'utf8');
        if (ccp.peers && ccp.peers['peer0.org2.example.com']) {
          ccp.peers['peer0.org2.example.com'].tlsCACerts = { pem };
        } else {
          console.warn('⚠️  CCP has no entry for peer0.org2.example.com — skipping TLS injection for this peer');
        }
      }

      // orderer
      const ordererTls = path.join(orgsBase, 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem');
      if (fs.existsSync(ordererTls)) {
        const pem = fs.readFileSync(ordererTls, 'utf8');
        if (ccp.orderers && ccp.orderers['orderer.example.com']) {
          ccp.orderers['orderer.example.com'].tlsCACerts = { pem };
        } else {
          console.warn('⚠️  CCP has no entry for orderer.example.com — skipping TLS injection for orderer');
        }
      }
    } catch (err) {
      // bubble up so callers know injection failed
      throw err;
    }
  }

  async initialize() {
    try {
      console.log('🔗 Initializing Fabric connection...');

      // Load connection profile
      const ccpPath = path.resolve(__dirname, '..', 'fabric-network', 'connection-profile.json');
      
      if (!fs.existsSync(ccpPath)) {
        console.log('⚠️  Connection profile not found. Blockchain features disabled.');
        return false;
      }

      const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
      const ccp = JSON.parse(ccpJSON);

      // Create wallet
      const walletPath = path.join(__dirname, '..', 'fabric-network', 'wallet');
      this.wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check if identity exists, if not create one
      let identity = await this.wallet.get('admin');
      
      if (!identity) {
        console.log('⚠️  Admin identity not found. Creating from certificates...');
        await this.enrollAdmin();
        identity = await this.wallet.get('admin');
      }

      if (!identity) {
        console.log('❌ Could not create admin identity. Blockchain features disabled.');
        return false;
      }

      // Connect to gateway
      this.gateway = new Gateway();
      // Try to inject TLS certs into the connection profile (if present on disk)
      try {
        this._injectTlsCerts(ccp);
      } catch (e) {
        console.warn('⚠️  Could not inject TLS certs into connection profile:', e.message);
      }

      // Debug: show first-line of any loaded peer/orderer PEMs to validate format
      try {
        Object.keys(ccp.peers || {}).forEach((p) => {
          const peer = ccp.peers[p];
          if (peer && peer.tlsCACerts && peer.tlsCACerts.pem) {
            console.log(`🔐 Peer ${p} TLS PEM head:`, peer.tlsCACerts.pem.split('\n')[0]);
          }
        });
        Object.keys(ccp.orderers || {}).forEach((o) => {
          const ord = ccp.orderers[o];
          if (ord && ord.tlsCACerts && ord.tlsCACerts.pem) {
            console.log(`🔐 Orderer ${o} TLS PEM head:`, ord.tlsCACerts.pem.split('\n')[0]);
          }
        });
      } catch (_) {
        // ignore debug errors
      }

      await this.gateway.connect(ccp, {
        wallet: this.wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
      });

      // Get network and contract
      this.network = await this.gateway.getNetwork('healthcarechannel');
      this.contract = this.network.getContract('healthcare');

      this.isConnected = true;
      console.log('✅ Connected to Fabric network successfully');
      return true;

    } catch (error) {
      console.error('❌ Fabric connection error:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async enrollAdmin() {
    try {
      // Import admin credentials from test-network
      const credPath = path.join(__dirname, '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com');

      // Ensure the credential path exists
      if (!fs.existsSync(credPath)) {
        throw new Error(`Admin credential path not found: ${credPath}`);
      }

      // Locate certificate (take first file in signcerts)
      const signcertsPath = path.join(credPath, 'msp', 'signcerts');
      if (!fs.existsSync(signcertsPath)) {
        throw new Error(`signcerts folder not found: ${signcertsPath}`);
      }
      const certFiles = fs.readdirSync(signcertsPath).filter(f => f && f.indexOf('.') !== -1);
      if (certFiles.length === 0) {
        throw new Error(`No certificate files found in: ${signcertsPath}`);
      }
      const certificate = fs.readFileSync(path.join(signcertsPath, certFiles[0])).toString();

      // Locate private key (take first file in keystore)
      const keyPath = path.join(credPath, 'msp', 'keystore');
      if (!fs.existsSync(keyPath)) {
        throw new Error(`keystore folder not found: ${keyPath}`);
      }
      const keyFiles = fs.readdirSync(keyPath).filter(f => f && f.indexOf('.') !== -1);
      if (keyFiles.length === 0) {
        throw new Error(`No private key files found in: ${keyPath}`);
      }
      const privateKey = fs.readFileSync(path.join(keyPath, keyFiles[0])).toString();

      const identity = {
        credentials: {
          certificate: certificate,
          privateKey: privateKey,
        },
        mspId: 'Org1MSP',
        type: 'X.509',
      };

      await this.wallet.put('admin', identity);
      console.log('✅ Admin identity enrolled successfully');
      return true;

    } catch (error) {
      console.error('❌ Error enrolling admin:', error && error.message ? error.message : error);
      return false;
    }
  }

  async submitTransaction(functionName, ...args) {
    try {
      if (!this.isConnected || !this.contract) {
        console.log('⚠️  Fabric not connected. Skipping blockchain transaction.');
        return null;
      }

      const result = await this.contract.submitTransaction(functionName, ...args);
      return result.toString();

    } catch (error) {
      console.error(`❌ Error submitting transaction ${functionName}:`, error.message);
      throw error;
    }
  }

  async evaluateTransaction(functionName, ...args) {
    try {
      if (!this.isConnected || !this.contract) {
        console.log('⚠️  Fabric not connected. Skipping blockchain query.');
        return null;
      }

      const result = await this.contract.evaluateTransaction(functionName, ...args);
      return result.toString();

    } catch (error) {
      console.error(`❌ Error evaluating transaction ${functionName}:`, error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.gateway) {
        await this.gateway.disconnect();
        this.isConnected = false;
        console.log('✅ Disconnected from Fabric network');
      }
    } catch (error) {
      console.error('❌ Error disconnecting:', error.message);
    }
  }
}

// Create singleton instance
const fabricConnection = new FabricConnection();

module.exports = fabricConnection;
