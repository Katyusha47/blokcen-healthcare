'use strict';

const { Contract } = require('fabric-contract-api');

class MedicalRecordContract extends Contract {
  
  // Initialize ledger
  async initLedger(ctx) {
    console.log('Medical Record Chaincode Initialized');
  }

  // Create medical record on blockchain
  async createMedicalRecord(ctx, recordDataString) {
    const recordData = JSON.parse(recordDataString);
    
    const medicalRecord = {
      recordId: recordData.recordId,
      patientId: recordData.patientId,
      doctorId: recordData.doctorId,
      recordHash: recordData.recordHash,
      timestamp: recordData.timestamp,
      action: recordData.action,
      txId: ctx.stub.getTxID(),
      docType: 'medicalRecord'
    };

    await ctx.stub.putState(recordData.recordId, Buffer.from(JSON.stringify(medicalRecord)));
    
    // Emit event
    ctx.stub.setEvent('MedicalRecordCreated', Buffer.from(JSON.stringify(medicalRecord)));
    
    return JSON.stringify(medicalRecord);
  }

  // Query medical record
  async queryMedicalRecord(ctx, recordId) {
    const recordBytes = await ctx.stub.getState(recordId);
    
    if (!recordBytes || recordBytes.length === 0) {
      throw new Error(`Medical record ${recordId} does not exist`);
    }
    
    return recordBytes.toString();
  }

  // Get record history (audit trail)
  async getRecordHistory(ctx, recordId) {
    const iterator = await ctx.stub.getHistoryForKey(recordId);
    const history = [];

    let result = await iterator.next();
    while (!result.done) {
      const record = {
        txId: result.value.txId,
        timestamp: result.value.timestamp,
        isDelete: result.value.isDelete,
        value: result.value.value.toString('utf8')
      };
      history.push(record);
      result = await iterator.next();
    }
    
    await iterator.close();
    return JSON.stringify(history);
  }

  // Record access event (for audit)
  async recordAccess(ctx, accessDataString) {
    const accessData = JSON.parse(accessDataString);
    
    const accessLog = {
      recordId: accessData.recordId,
      userId: accessData.userId,
      userRole: accessData.userRole,
      action: accessData.action,
      timestamp: new Date().toISOString(),
      txId: ctx.stub.getTxID(),
      docType: 'accessLog'
    };

    const key = `ACCESS_${accessData.recordId}_${Date.now()}`;
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(accessLog)));
    
    return JSON.stringify(accessLog);
  }

  // Query records by patient
  async queryRecordsByPatient(ctx, patientId) {
    const queryString = {
      selector: {
        docType: 'medicalRecord',
        patientId: patientId
      }
    };

    return await this._getQueryResultForQueryString(ctx, JSON.stringify(queryString));
  }

  // Query records by doctor
  async queryRecordsByDoctor(ctx, doctorId) {
    const queryString = {
      selector: {
        docType: 'medicalRecord',
        doctorId: doctorId
      }
    };

    return await this._getQueryResultForQueryString(ctx, JSON.stringify(queryString));
  }

  // Helper function for queries
  async _getQueryResultForQueryString(ctx, queryString) {
    const iterator = await ctx.stub.getQueryResult(queryString);
    const results = [];

    let result = await iterator.next();
    while (!result.done) {
      const record = {
        key: result.value.key,
        record: JSON.parse(result.value.value.toString('utf8'))
      };
      results.push(record);
      result = await iterator.next();
    }
    
    await iterator.close();
    return JSON.stringify(results);
  }
}

module.exports = MedicalRecordContract;
