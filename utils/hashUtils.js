const crypto = require('crypto');

class HashUtils {
  // Generate SHA-256 hash from medical record data
  static generateHash(recordData) {
    const dataString = JSON.stringify({
      patientId: recordData.patientId,
      doctorId: recordData.doctorId,
      diagnosis: recordData.diagnosis,
      treatment: recordData.treatment,
      medications: recordData.medications,
      timestamp: recordData.timestamp || new Date().toISOString()
    });

    return crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');
  }

  // Verify hash
  static verifyHash(recordData, existingHash) {
    const newHash = this.generateHash(recordData);
    return newHash === existingHash;
  }

  // Generate transaction ID
  static generateTxId() {
    return 'TX-' + Date.now() + '-' + crypto.randomBytes(8).toString('hex');
  }
}

module.exports = HashUtils;
