const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

class FabricConnection {
  constructor() {
    this.gateway = null;
    this.wallet = null;
    this.network = null;
    this.contract = null;
  }

  async initialize() {
    try {
      // Load connection profile
      const ccpPath = path.resolve(__dirname, '..', 'fabric-network', 'connection-profile.json');
      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

      // Create wallet
      const walletPath = path.join(__dirname, '..', 'fabric-network', 'wallet');
      this.wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check if identity exists
      const identity = await this.wallet.get('admin');
      if (!identity) {
        console.log('⚠️  Admin identity not found in wallet. Please enroll admin first.');
        return false;
      }

      // Connect to gateway
      this.gateway = new Gateway();
      await this.gateway.connect(ccp, {
        wallet: this.wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
      });

      // Get network and contract
      this.network = await this.gateway.getNetwork(process.env.CHANNEL_NAME);
      this.contract = this.network.getContract(process.env.CHAINCODE_NAME);

      console.log('✅ Hyperledger Fabric Connected Successfully');
      return true;
    } catch (error) {
      console.error('❌ Fabric Connection Error:', error.message);
      return false;
    }
  }

  async submitTransaction(functionName, ...args) {
    try {
      if (!this.contract) {
        await this.initialize();
      }
      const result = await this.contract.submitTransaction(functionName, ...args);
      return JSON.parse(result.toString());
    } catch (error) {
      console.error('Transaction Error:', error);
      throw error;
    }
  }

  async evaluateTransaction(functionName, ...args) {
    try {
      if (!this.contract) {
        await this.initialize();
      }
      const result = await this.contract.evaluateTransaction(functionName, ...args);
      return JSON.parse(result.toString());
    } catch (error) {
      console.error('Query Error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.gateway) {
      await this.gateway.disconnect();
    }
  }
}

module.exports = new FabricConnection();
