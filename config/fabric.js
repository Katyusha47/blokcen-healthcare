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
    // Load TLS CA certs from organizations folder and attach PEM strings to ccp.
    // Also attempt to persist PEMs into connection-profile.json (dev convenience) when found.
    try {
      const orgsBase = path.join(__dirname, '..', 'organizations');
      const found = [];

      // helper: try array of candidate paths, return first that exists
      const findFirst = (candidates) => {
        for (const p of candidates) {
          if (fs.existsSync(p)) return p;
        }
        return null;
      };

      // peer0.org1 - only attach if peer entry already exists in the CCP
      const peer1Candidates = [
        path.join(orgsBase, 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'),
        path.join(orgsBase, 'peerOrganizations', 'org1.example.com', 'msp', 'tlscacerts', 'tlsca.org1.example.com-cert.pem')
      ];
      const peer1Tls = findFirst(peer1Candidates);
      if (peer1Tls) {
        const pem = fs.readFileSync(peer1Tls, 'utf8');
        if (ccp.peers && ccp.peers['peer0.org1.example.com']) {
          ccp.peers['peer0.org1.example.com'].tlsCACerts = { pem };
          found.push({ name: 'peer0.org1.example.com', file: peer1Tls });
        } else {
          console.warn('CCP has no entry for peer0.org1.example.com — skipping TLS injection for this peer');
        }
      }

      // peer0.org2 (if exists) - try both candidate locations
      const peer2Candidates = [
        path.join(orgsBase, 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt'),
        path.join(orgsBase, 'peerOrganizations', 'org2.example.com', 'msp', 'tlscacerts', 'tlsca.org2.example.com-cert.pem')
      ];
      const peer2Tls = findFirst(peer2Candidates);
      if (peer2Tls) {
        const pem = fs.readFileSync(peer2Tls, 'utf8');
        if (ccp.peers && ccp.peers['peer0.org2.example.com']) {
          ccp.peers['peer0.org2.example.com'].tlsCACerts = { pem };
          found.push({ name: 'peer0.org2.example.com', file: peer2Tls });
        } else {
          console.warn('CCP has no entry for peer0.org2.example.com — skipping TLS injection for this peer');
        }
      }

      // orderer - multiple possible locations used by test-network
      const ordererCandidates = [
        path.join(orgsBase, 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem'),
        path.join(orgsBase, 'ordererOrganizations', 'example.com', 'orderers', 'orderer.example.com', 'tls', 'ca.crt'),
        path.join(orgsBase, 'ordererOrganizations', 'example.com', 'msp', 'tlscacerts', 'tlsca.example.com-cert.pem')
      ];
      const ordererTls = findFirst(ordererCandidates);
      if (ordererTls) {
        const pem = fs.readFileSync(ordererTls, 'utf8');
        if (ccp.orderers && ccp.orderers['orderer.example.com']) {
          ccp.orderers['orderer.example.com'].tlsCACerts = { pem };
          found.push({ name: 'orderer.example.com', file: ordererTls });
        } else {
          console.warn('CCP has no entry for orderer.example.com — skipping TLS injection for orderer');
        }
      }

      // If we injected any PEMs, log which files were used
      if (found.length > 0) {
        found.forEach(f => console.log(`Injected TLS PEM for ${f.name} from ${f.file}`));

        // Attempt to persist the PEMs back into connection-profile.json for convenience (dev only)
        try {
          const ccpPath = path.resolve(__dirname, '..', 'fabric-network', 'connection-profile.json');
          if (fs.existsSync(ccpPath)) {
            const raw = fs.readFileSync(ccpPath, 'utf8');
            const diskCcp = JSON.parse(raw);
            // merge tlsCACerts.pem for any peers/orderers we injected
            found.forEach(f => {
              if (diskCcp.peers && diskCcp.peers[f.name]) {
                diskCcp.peers[f.name].tlsCACerts = diskCcp.peers[f.name].tlsCACerts || {};
                diskCcp.peers[f.name].tlsCACerts.pem = ccp.peers[f.name].tlsCACerts.pem;
              }
              if (diskCcp.orderers && diskCcp.orderers[f.name]) {
                diskCcp.orderers[f.name].tlsCACerts = diskCcp.orderers[f.name].tlsCACerts || {};
                diskCcp.orderers[f.name].tlsCACerts.pem = ccp.orderers[f.name].tlsCACerts.pem;
              }
            });
            fs.writeFileSync(ccpPath, JSON.stringify(diskCcp, null, 2), 'utf8');
            console.log('Persisted injected TLS PEMs into fabric-network/connection-profile.json');
          }
        } catch (e) {
          console.warn('Could not persist injected PEMs into connection-profile.json:', e.message);
        }
      }

    } catch (err) {
      // bubble up so callers know injection failed
      throw err;
    }
  }

  async initialize() {
    try {
      console.log('Initializing Fabric connection...');

      // Load connection profile
      const ccpPath = path.resolve(__dirname, '..', 'fabric-network', 'connection-profile.json');
      
      if (!fs.existsSync(ccpPath)) {
        console.log('Connection profile not found. Blockchain features disabled.');
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
        console.log('Admin identity not found. Creating from certificates...');
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
        console.warn('Could not inject TLS certs into connection profile:', e.message);
      }

      // Debug: show first-line of any loaded peer/orderer PEMs to validate format
      try {
        Object.keys(ccp.peers || {}).forEach((p) => {
          const peer = ccp.peers[p];
          if (peer && peer.tlsCACerts && peer.tlsCACerts.pem) {
            console.log(`Peer ${p} TLS PEM head:`, peer.tlsCACerts.pem.split('\n')[0]);
          }
        });
        Object.keys(ccp.orderers || {}).forEach((o) => {
          const ord = ccp.orderers[o];
          if (ord && ord.tlsCACerts && ord.tlsCACerts.pem) {
            console.log(`Orderer ${o} TLS PEM head:`, ord.tlsCACerts.pem.split('\n')[0]);
          }
        });
        // Also print url for each peer and orderer to diagnose missing url errors
        Object.keys(ccp.peers || {}).forEach((p) => {
          const peer = ccp.peers[p];
          console.log(`CCP Peer entry: ${p} url:`, peer && peer.url ? peer.url : '(MISSING)');
        });
        Object.keys(ccp.orderers || {}).forEach((o) => {
          const ord = ccp.orderers[o];
          console.log(`CCP Orderer entry: ${o} url:`, ord && ord.url ? ord.url : '(MISSING)');
        });

        // Runtime check: ensure any grpcs:// endpoint has a tlsCACerts.pem provided
        try {
          const missing = [];
          Object.keys(ccp.peers || {}).forEach((p) => {
            const peer = ccp.peers[p];
            if (peer && peer.url && peer.url.toLowerCase().startsWith('grpcs://')) {
              if (!peer.tlsCACerts || !peer.tlsCACerts.pem) {
                missing.push(`peer ${p}`);
              }
            }
          });
          Object.keys(ccp.orderers || {}).forEach((o) => {
            const ord = ccp.orderers[o];
            if (ord && ord.url && ord.url.toLowerCase().startsWith('grpcs://')) {
              if (!ord.tlsCACerts || !ord.tlsCACerts.pem) {
                missing.push(`orderer ${o}`);
              }
            }
          });
          if (missing.length > 0) {
            console.error('Missing TLS PEM(s) for endpoints:', missing.join(', '));
            console.error('Ensure TLS CA PEMs are present in the organizations folder or in the connection-profile.json under tlsCACerts.pem');
            throw new Error(`PEM encoded certificate is required for: ${missing.join(', ')}`);
          }
        } catch (e) {
          // Re-throw so outer catch prints a single clear message
          throw e;
        }
      } catch (_) {
        // ignore debug errors
      }

      // Attempt to connect with a small retry loop — peers may still be warming up.
      const maxRetries = parseInt(process.env.FABRIC_CONNECT_RETRIES || '5', 10);
      const delayMs = parseInt(process.env.FABRIC_CONNECT_DELAY_MS || '2000', 10);
      let connected = false;
      let lastErr = null;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Gateway connect attempt ${attempt}/${maxRetries}...`);
          await this.gateway.connect(ccp, {
            wallet: this.wallet,
            identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
          });
          connected = true;
          break;
        } catch (err) {
          lastErr = err;
          console.warn(`Gateway connect attempt ${attempt} failed: ${err.message}`);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, delayMs));
            console.log('Retrying gateway.connect...');
          }
        }
      }
      if (!connected) {
        throw lastErr || new Error('Failed to connect gateway after retries');
      }

      // Get network and contract
      this.network = await this.gateway.getNetwork('healthcarechannel');
      this.contract = this.network.getContract('healthcare');

      this.isConnected = true;
      console.log('Connected to Fabric network successfully');
      return true;

    } catch (error) {
      console.error('Fabric connection error:', error.message);
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
      // Choose the first regular file in signcerts (filenames may not contain dots)
      const certFiles = fs.readdirSync(signcertsPath).filter(f => {
        try { return fs.statSync(path.join(signcertsPath, f)).isFile(); } catch { return false; }
      });
      if (certFiles.length === 0) {
        throw new Error(`No certificate files found in: ${signcertsPath}`);
      }
      console.log('Found signcert files:', certFiles);
      const certificate = fs.readFileSync(path.join(signcertsPath, certFiles[0]), 'utf8').toString();

      // Locate private key (take first file in keystore)
      const keyPath = path.join(credPath, 'msp', 'keystore');
      if (!fs.existsSync(keyPath)) {
        throw new Error(`keystore folder not found: ${keyPath}`);
      }
      // Choose the first regular file in keystore (key filename may not have an extension)
      const keyFiles = fs.readdirSync(keyPath).filter(f => {
        try { return fs.statSync(path.join(keyPath, f)).isFile(); } catch { return false; }
      });
      if (keyFiles.length === 0) {
        throw new Error(`No private key files found in: ${keyPath}`);
      }
      console.log('Found keystore files:', keyFiles);
      const privateKey = fs.readFileSync(path.join(keyPath, keyFiles[0]), 'utf8').toString();

      const identity = {
        credentials: {
          certificate: certificate,
          privateKey: privateKey,
        },
        mspId: 'Org1MSP',
        type: 'X.509',
      };

      await this.wallet.put('admin', identity);
      console.log('Admin identity enrolled successfully');
      return true;

    } catch (error) {
      console.error('Error enrolling admin:', error && error.message ? error.message : error);
      return false;
    }
  }

  async submitTransaction(functionName, ...args) {
    try {
      if (!this.isConnected || !this.contract) {
        console.log('Fabric not connected. Skipping blockchain transaction.');
        return null;
      }

      const result = await this.contract.submitTransaction(functionName, ...args);
      return result.toString();

      } catch (error) {
      console.error(`Error submitting transaction ${functionName}:`, error.message);
      throw error;
    }
  }

  async evaluateTransaction(functionName, ...args) {
    try {
      if (!this.isConnected || !this.contract) {
        console.log('Fabric not connected. Skipping blockchain query.');
        return null;
      }

      const result = await this.contract.evaluateTransaction(functionName, ...args);
      return result.toString();

    } catch (error) {
      console.error(`Error evaluating transaction ${functionName}:`, error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.gateway) {
        await this.gateway.disconnect();
        this.isConnected = false;
        console.log('Disconnected from Fabric network');
      }
    } catch (error) {
      console.error('Error disconnecting:', error.message);
    }
  }
}

// Create singleton instance
const fabricConnection = new FabricConnection();

module.exports = fabricConnection;
