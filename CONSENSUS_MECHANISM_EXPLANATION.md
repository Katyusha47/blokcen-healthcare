# Consensus Mechanism in Hyperledger Fabric Healthcare Blockchain System

## 1. Introduction to Consensus in Distributed Systems

### 1.1 Theoretical Foundation

Consensus is a fundamental problem in distributed computing where multiple nodes must agree on a single data value or state despite the presence of faulty or malicious nodes. In blockchain systems, consensus mechanisms ensure that all nodes maintain identical copies of the distributed ledger and agree on the order and validity of transactions.

### 1.2 Byzantine Fault Tolerance

Hyperledger Fabric implements a practical Byzantine Fault Tolerant (BFT) consensus mechanism, which can tolerate Byzantine failures—scenarios where nodes may exhibit arbitrary or malicious behavior. The system can reach consensus as long as fewer than one-third of the nodes are faulty or malicious.

---

## 2. Hyperledger Fabric's Execute-Order-Validate Architecture

Unlike traditional blockchain systems that follow an "Order-Execute" model (e.g., Bitcoin, Ethereum), Hyperledger Fabric implements an innovative "Execute-Order-Validate" architecture that separates consensus into three distinct phases:

### 2.1 Phase 1: Transaction Execution (Endorsement)

**Purpose**: Simulate transaction execution and gather endorsements from required peers.

**Process**:
1. Client application proposes a transaction
2. Endorsing peers simulate the transaction execution
3. Peers generate a Read-Write (RW) set
4. Peers sign the endorsement and return it to the client

**Code Implementation in Healthcare System**:

```javascript
// File: controllers/recordController.js
static async createRecord(req, res) {
  try {
    const { patientId, diagnosis, treatment, notes } = req.body;
    
    // Calculate hash for data integrity
    const recordHash = hashUtils.calculateHash({
      patientId,
      doctorId: req.user.id,
      diagnosis,
      treatment,
      timestamp: new Date()
    });

    // Prepare blockchain transaction data
    const blockchainData = JSON.stringify({
      recordId: record.insertId,
      patientId,
      doctorId: req.user.id,
      recordHash,
      timestamp: new Date().toISOString(),
      action: 'create'
    });

    // Submit to Fabric network for endorsement
    const txId = await fabricConnection.submitTransaction(
      'createMedicalRecord',
      blockchainData
    );

    // Transaction is endorsed by required peers before returning
    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      recordId: record.insertId,
      blockchainTx: txId
    });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medical record'
    });
  }
}
```

**Fabric SDK Transaction Submission**:

```javascript
// File: config/fabric.js
async submitTransaction(functionName, ...args) {
  try {
    if (!this.isConnected || !this.contract) {
      console.log('⚠️  Fabric not connected. Skipping blockchain transaction.');
      return null;
    }

    // Submit transaction proposal to endorsing peers
    // Peers will execute chaincode and return endorsements
    const result = await this.contract.submitTransaction(functionName, ...args);
    return result.toString();

  } catch (error) {
    console.error(`❌ Error submitting transaction ${functionName}:`, error.message);
    throw error;
  }
}
```

**Chaincode Execution on Peer**:

```javascript
// File: fabric-network/chaincode/medicalRecords.js
async createMedicalRecord(ctx, recordData) {
  console.info('============= START : Create Medical Record ===========');
  
  // Parse input data
  const record = JSON.parse(recordData);
  
  // Validate input
  if (!record.recordId || !record.patientId || !record.doctorId) {
    throw new Error('Missing required fields');
  }

  // Generate composite key for the record
  const recordKey = `RECORD_${record.recordId}`;
  
  // Add metadata
  record.docType = 'medicalRecord';
  record.createdAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();

  // Write to ledger (generates read-write set)
  await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(record)));
  
  console.info('============= END : Create Medical Record ===========');
  return JSON.stringify(record);
}
```

### 2.2 Endorsement Policy

The endorsement policy defines which organizations must endorse a transaction for it to be valid. In this healthcare system, the policy requires endorsement from **both Org1 and Org2**.

**Endorsement Policy Configuration**:

```bash
# Command used during chaincode deployment
peer lifecycle chaincode commit \
  -o localhost:7050 \
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

**Mathematical Representation**:

Let $E$ be the set of endorsements required, and $O$ be the set of organizations:

$$E = \{e_1, e_2, ..., e_n\} \text{ where } e_i \in O$$

For transaction $T$ to be valid:
$$\forall o_i \in O_{required}, \exists e_j \in E : e_j.org = o_i$$

In this system: $O_{required} = \{Org1MSP, Org2MSP\}$

---

### 2.3 Phase 2: Transaction Ordering

**Purpose**: Establish a total order of transactions across the network.

**Process**:
1. Client collects endorsed transaction proposals
2. Client submits endorsed transaction to ordering service
3. Orderer sequences transactions into blocks
4. Orderer distributes blocks to all peers in the channel

**Ordering Service Configuration**:

```yaml
# Conceptual representation of orderer configuration
OrdererType: Solo  # For development (single orderer)
# OrdererType: Raft  # For production (multiple orderers with leader election)

BatchTimeout: 2s   # Maximum time to wait before cutting a block
BatchSize:
  MaxMessageCount: 10      # Maximum number of messages in a block
  AbsoluteMaxBytes: 99 MB  # Maximum block size
  PreferredMaxBytes: 512 KB # Preferred block size
```

**Ordering Algorithm (Raft Consensus)**:

For production environments, Hyperledger Fabric uses Raft consensus among ordering nodes. Raft is a crash fault-tolerant (CFT) consensus algorithm that operates through leader election.

**Raft Consensus Phases**:

1. **Leader Election**: 
   ```
   If no heartbeat from leader for election timeout:
       Change state to CANDIDATE
       Increment current term
       Vote for self
       Request votes from other nodes
       If receives majority votes:
           Become LEADER
   ```

2. **Log Replication**:
   ```
   Leader receives client request:
       Append entry to local log
       Send AppendEntries RPC to followers
       Wait for majority acknowledgment
       Commit entry and apply to state machine
       Notify followers to commit
   ```

**Code Representation of Ordering Logic**:

```javascript
// Conceptual representation of ordering service logic
class OrderingService {
  constructor() {
    this.pendingTransactions = [];
    this.currentBlock = null;
    this.blockTimeout = 2000; // 2 seconds
    this.maxBlockSize = 10;
  }

  async receiveTransaction(endorsedTransaction) {
    // Validate endorsement signatures
    if (!this.validateEndorsements(endorsedTransaction)) {
      throw new Error('Invalid endorsements');
    }

    // Add to pending queue
    this.pendingTransactions.push(endorsedTransaction);

    // Check if block should be cut
    if (this.shouldCutBlock()) {
      await this.createAndDistributeBlock();
    }
  }

  shouldCutBlock() {
    return (
      this.pendingTransactions.length >= this.maxBlockSize ||
      (Date.now() - this.blockStartTime) >= this.blockTimeout
    );
  }

  async createAndDistributeBlock() {
    // Create block with ordered transactions
    const block = {
      blockNumber: this.currentBlockNumber++,
      previousHash: this.lastBlockHash,
      transactions: [...this.pendingTransactions],
      timestamp: Date.now()
    };

    // Calculate block hash
    block.hash = this.calculateBlockHash(block);

    // Distribute to all peers
    await this.distributeBlockToPeers(block);

    // Clear pending transactions
    this.pendingTransactions = [];
    this.lastBlockHash = block.hash;
  }
}
```

---

### 2.4 Phase 3: Transaction Validation and Commitment

**Purpose**: Validate transactions in the block and commit valid ones to the ledger.

**Process**:
1. Peers receive ordered blocks from orderer
2. Each peer independently validates transactions
3. Peers commit valid transactions to their local ledger
4. World state database is updated

**Validation Checks**:

```javascript
// Conceptual representation of validation logic
class TransactionValidator {
  async validateTransaction(transaction, blockContext) {
    // 1. Validate endorsement policy
    if (!this.checkEndorsementPolicy(transaction)) {
      return { valid: false, reason: 'Endorsement policy not satisfied' };
    }

    // 2. Validate read-write set
    if (!this.validateRWSet(transaction, blockContext)) {
      return { valid: false, reason: 'Read-write set conflict (MVCC check failed)' };
    }

    // 3. Validate transaction structure
    if (!this.validateStructure(transaction)) {
      return { valid: false, reason: 'Invalid transaction structure' };
    }

    // 4. Check against chaincode VSCC (Validation System Chaincode)
    if (!this.runVSCC(transaction)) {
      return { valid: false, reason: 'VSCC validation failed' };
    }

    return { valid: true };
  }

  validateRWSet(transaction, blockContext) {
    // Multi-Version Concurrency Control (MVCC) check
    for (const read of transaction.readSet) {
      const currentVersion = blockContext.getVersion(read.key);
      if (currentVersion !== read.version) {
        // Read-write conflict detected
        return false;
      }
    }
    return true;
  }

  checkEndorsementPolicy(transaction) {
    const policy = this.getEndorsementPolicy(transaction.chaincode);
    const endorsements = transaction.endorsements;

    // Check if endorsements satisfy policy
    // For example: Require Org1 AND Org2
    const org1Endorsed = endorsements.some(e => e.mspId === 'Org1MSP');
    const org2Endorsed = endorsements.some(e => e.mspId === 'Org2MSP');

    return org1Endorsed && org2Endorsed;
  }
}
```

**Ledger Commitment**:

```javascript
// Conceptual representation of ledger commit
class LedgerManager {
  async commitBlock(block) {
    console.log(`Committing block ${block.blockNumber}`);

    for (const transaction of block.transactions) {
      // Validate transaction
      const validation = await this.validator.validateTransaction(
        transaction, 
        this.currentState
      );

      if (validation.valid) {
        // Apply write set to world state
        for (const write of transaction.writeSet) {
          await this.worldState.putState(write.key, write.value);
        }

        // Mark transaction as valid
        transaction.validationCode = 'VALID';
      } else {
        // Mark transaction as invalid
        transaction.validationCode = validation.reason;
      }

      // Store transaction in blockchain (even invalid ones for audit)
      await this.blockchain.appendTransaction(transaction);
    }

    // Append block to blockchain
    await this.blockchain.appendBlock(block);

    // Emit block commit event
    this.eventHub.emit('blockCommitted', block);
  }
}
```

---

## 3. Consensus Flow in Medical Record Creation

### 3.1 Complete Transaction Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Transaction Consensus Flow                        │
└─────────────────────────────────────────────────────────────────────┘

Step 1: PROPOSAL
    Client Application (Node.js)
         │
         │ submitTransaction('createMedicalRecord', data)
         ├────────────────────────────────────────────┐
         │                                            │
         ▼                                            ▼
    Peer0.Org1 (Port 7051)                   Peer0.Org2 (Port 9051)
         │                                            │
         │ Execute Chaincode                          │ Execute Chaincode
         │ Generate RW Set                            │ Generate RW Set
         │ Sign Endorsement                           │ Sign Endorsement
         │                                            │
         └────────────────┬───────────────────────────┘
                          │
                          ▼
                    [Endorsements Collected]

Step 2: ORDERING
         Client sends endorsed transaction to Orderer
                          │
                          ▼
                 Orderer (Port 7050)
                          │
                          │ • Validate signatures
                          │ • Order transactions
                          │ • Create block
                          │ • Broadcast block
                          │
         ┌────────────────┴────────────────┐
         │                                  │
         ▼                                  ▼
    Peer0.Org1                         Peer0.Org2

Step 3: VALIDATION & COMMIT
    Each peer validates independently:
         │
         ├─► Check endorsement policy satisfied? ✓
         ├─► Validate RW set (MVCC check)? ✓
         ├─► Run VSCC validation? ✓
         │
         ▼
    [All checks passed]
         │
         ├─► Commit to ledger
         ├─► Update world state (CouchDB)
         └─► Emit block event

Result: Transaction is committed with consensus from all peers
```

### 3.2 Code Example with Consensus Points

```javascript
// Complete flow from application to blockchain
async function createMedicalRecordWithConsensus() {
  try {
    // ═══════════════════════════════════════════════════════
    // PHASE 1: ENDORSEMENT (First Consensus Point)
    // ═══════════════════════════════════════════════════════
    
    // Prepare transaction data
    const recordData = {
      recordId: 123,
      patientId: 1,
      doctorId: 2,
      diagnosis: 'Hypertension',
      treatment: 'Medication prescribed',
      recordHash: '5f3c8d9a2b7e4f1c8d9a...',
      timestamp: '2025-11-05T10:00:00Z'
    };

    console.log('Step 1: Sending transaction proposal to endorsing peers...');
    
    // SDK internally sends to both Org1 and Org2 peers
    const transaction = await contract.createTransaction('createMedicalRecord');
    
    // Set endorsing peers (both required for consensus)
    transaction.setEndorsingPeers([
      'peer0.org1.example.com',
      'peer0.org2.example.com'
    ]);

    // Submit proposal - waits for endorsements
    const proposalResponse = await transaction.submit(JSON.stringify(recordData));
    
    // At this point:
    // ✓ Org1 peer executed chaincode and endorsed
    // ✓ Org2 peer executed chaincode and endorsed
    // ✓ Both endorsements collected (CONSENSUS #1)
    
    console.log('✓ Transaction endorsed by required peers');

    // ═══════════════════════════════════════════════════════
    // PHASE 2: ORDERING (Second Consensus Point)
    // ═══════════════════════════════════════════════════════
    
    console.log('Step 2: Submitting endorsed transaction to orderer...');
    
    // SDK sends endorsed transaction to ordering service
    // Orderer sequences it with other transactions
    // Creates block when criteria met (timeout or size)
    
    // If using Raft: Orderers reach consensus on block order
    // Leader orderer replicates to follower orderers
    // Majority acknowledgment required (CONSENSUS #2)
    
    console.log('✓ Transaction ordered and included in block');

    // ═══════════════════════════════════════════════════════
    // PHASE 3: VALIDATION & COMMIT (Third Consensus Point)
    // ═══════════════════════════════════════════════════════
    
    console.log('Step 3: Peers validating and committing block...');
    
    // Each peer independently validates:
    // 1. Endorsement policy check
    const endorsementValid = (
      hasEndorsement('Org1MSP') && 
      hasEndorsement('Org2MSP')
    );
    
    // 2. MVCC validation (read-write set conflicts)
    const mvccValid = checkReadWriteConflicts(transaction);
    
    // 3. VSCC execution
    const vsccValid = runValidationSystemChaincode(transaction);
    
    if (endorsementValid && mvccValid && vsccValid) {
      // Commit transaction to ledger
      await commitToLedger(transaction);
      await updateWorldState(transaction.writeSet);
      
      console.log('✓ Transaction validated and committed by all peers');
      console.log('✓ CONSENSUS ACHIEVED - Transaction is final and immutable');
    }

    // Return transaction ID
    return {
      success: true,
      txId: transaction.getTransactionId(),
      blockNumber: transaction.getBlockNumber(),
      consensusAchieved: true
    };

  } catch (error) {
    console.error('Consensus failed:', error.message);
    throw error;
  }
}
```

---

## 4. Consensus Properties and Guarantees

### 4.1 Safety Properties

**Definition**: Safety ensures that "nothing bad happens" - the system never reaches an invalid state.

**Guarantees in Hyperledger Fabric**:

1. **Agreement**: All honest nodes agree on the same sequence of transactions
2. **Validity**: Only validly endorsed transactions are committed
3. **Immutability**: Once committed, transactions cannot be altered or removed

**Mathematical Proof Sketch**:

Given:
- $N$ = Total number of nodes
- $F$ = Number of faulty nodes
- Assumption: $F < N/3$ (Byzantine fault tolerance threshold)

Theorem: If a transaction $T$ is committed by an honest node, all honest nodes will commit $T$ in the same position.

Proof:
1. Transaction $T$ must be endorsed by required peers (endorsement policy)
2. Orderer service creates deterministic ordering
3. All peers receive identical blocks from orderer
4. Validation rules are deterministic
5. Therefore, all honest nodes reach same conclusion
∎

### 4.2 Liveness Properties

**Definition**: Liveness ensures that "something good eventually happens" - the system makes progress.

**Guarantees**:

1. **Eventual Consistency**: All nodes eventually reflect the same state
2. **Progress**: New transactions are continuously processed
3. **Responsiveness**: System responds to client requests within bounded time

**Crash Fault Tolerance with Raft**:

Raft consensus can tolerate $f$ crashed nodes out of $2f + 1$ total nodes.

Example: With 5 orderers, system remains operational with 2 failures.

---

## 5. Consensus Configuration in Healthcare System

### 5.1 Network Configuration

```yaml
# connection-profile.json (simplified)
{
  "name": "healthcare-network",
  "organizations": {
    "Org1": {
      "mspid": "Org1MSP",
      "peers": ["peer0.org1.example.com"]
    },
    "Org2": {
      "mspid": "Org2MSP",
      "peers": ["peer0.org2.example.com"]
    }
  },
  "peers": {
    "peer0.org1.example.com": {
      "url": "grpcs://localhost:7051",
      "endorsementRequired": true
    },
    "peer0.org2.example.com": {
      "url": "grpcs://localhost:9051",
      "endorsementRequired": true
    }
  },
  "orderers": {
    "orderer.example.com": {
      "url": "grpcs://localhost:7050",
      "consensusType": "solo"  // Development
      // "consensusType": "raft"  // Production
    }
  }
}
```

### 5.2 Endorsement Policy Definition

```javascript
// Endorsement policy: AND('Org1MSP.peer', 'Org2MSP.peer')
// Both organizations must endorse

const endorsementPolicy = {
  identities: [
    { role: { name: 'member', mspId: 'Org1MSP' } },
    { role: { name: 'member', mspId: 'Org2MSP' } }
  ],
  policy: {
    '2-of': [
      { 'signed-by': 0 },  // Org1
      { 'signed-by': 1 }   // Org2
    ]
  }
};

// Alternative policies:
// OR policy: '1-of': [...]     // Either org can endorse
// Majority: 'n-of': [...]      // n out of m orgs must endorse
// Complex: nested AND/OR       // Sophisticated policies
```

---

## 6. Performance Analysis

### 6.1 Consensus Latency

**Theoretical Analysis**:

Total latency $L_{total}$ = $L_{endorse}$ + $L_{order}$ + $L_{validate}$

Where:
- $L_{endorse}$ = max(execution time across endorsing peers)
- $L_{order}$ = ordering service latency (block cut time)
- $L_{validate}$ = validation and commit time

**Empirical Measurements** (typical values):

```
Endorsement Phase:    50-200ms   (depends on chaincode complexity)
Ordering Phase:       1-3s       (depends on block timeout)
Validation Phase:     50-100ms   (depends on block size)
───────────────────────────────
Total Latency:        1.1-3.3s   (average ~2s)
```

### 6.2 Throughput Analysis

**Theoretical Throughput**:

$$TPS = \frac{BlockSize}{BlockTime} \times SuccessRate$$

Where:
- $BlockSize$ = Maximum transactions per block (configurable)
- $BlockTime$ = Block creation interval (configurable)
- $SuccessRate$ = Percentage of valid transactions

**Example Calculation**:

```javascript
const blockSize = 100;           // transactions per block
const blockTime = 2;             // seconds
const successRate = 0.95;        // 95% valid transactions

const throughput = (blockSize / blockTime) * successRate;
console.log(`Throughput: ${throughput} TPS`);
// Output: Throughput: 47.5 TPS
```

---

## 7. Consensus Security Analysis

### 7.1 Attack Resistance

**Byzantine Attack Resistance**:

The system can tolerate up to $f$ Byzantine (malicious) nodes where:
- For endorsement: Can tolerate minority of endorsing orgs
- For ordering (Raft): Can tolerate $\lfloor (n-1)/2 \rfloor$ crashed orderers

**Attack Scenarios and Defenses**:

1. **Double-Spend Attack**:
   - Defense: MVCC validation detects conflicting reads
   
2. **Malicious Endorsement**:
   - Defense: Requires multiple independent endorsements
   
3. **Ordering Manipulation**:
   - Defense: Raft consensus among orderers

### 7.2 Cryptographic Foundations

**Digital Signatures**:

```javascript
// Each endorsement includes:
const endorsement = {
  endorser: 'Org1MSP',
  signature: sign(hash(proposalResponse), privateKey),
  proposalResponsePayload: {
    readWriteSet: {...},
    result: {...}
  }
};

// Verification:
function verifyEndorsement(endorsement, publicKey) {
  const hash = computeHash(endorsement.proposalResponsePayload);
  return verify(endorsement.signature, hash, publicKey);
}
```

---

## 8. Comparison with Other Consensus Mechanisms

### 8.1 Comparison Table

| Mechanism | Type | Throughput | Latency | Energy | Use Case |
|-----------|------|------------|---------|--------|----------|
| **Fabric (This System)** | Execute-Order-Validate | High (1000+ TPS) | Medium (1-3s) | Low | Permissioned enterprise |
| Bitcoin (PoW) | Order-Execute | Low (7 TPS) | High (10min) | Very High | Cryptocurrency |
| Ethereum (PoS) | Order-Execute | Medium (30 TPS) | Medium (15s) | Medium | Smart contracts |
| Tendermint (BFT) | Order-Execute | High (1000+ TPS) | Low (<1s) | Low | Permissioned chains |

### 8.2 Advantages of Fabric's Consensus

1. **Parallel Execution**: Transactions executed before ordering (higher throughput)
2. **Flexible Policies**: Organization-specific endorsement requirements
3. **Privacy**: Confidential transactions within channels
4. **Determinism**: No non-deterministic smart contract issues
5. **Performance**: Optimized for permissioned environments

---

## 9. Conclusion

The Hyperledger Fabric consensus mechanism implemented in this healthcare blockchain system provides:

1. **Robust Byzantine Fault Tolerance**: Ensures security against malicious nodes
2. **High Performance**: Execute-Order-Validate architecture enables high throughput
3. **Flexibility**: Configurable endorsement policies for different use cases
4. **Determinism**: Predictable transaction outcomes
5. **Privacy**: Channel-based isolation and confidential transactions

The multi-phase consensus ensures that all medical records are:
- **Authentic**: Endorsed by authorized organizations
- **Ordered**: Consistently sequenced across all nodes
- **Valid**: Verified through rigorous validation checks
- **Immutable**: Permanently recorded in the blockchain

This consensus mechanism provides the foundation for a trustworthy, auditable, and secure healthcare data management system.

---

## References

1. Androulaki, E., et al. (2018). "Hyperledger Fabric: A Distributed Operating System for Permissioned Blockchains." *EuroSys 2018*.

2. Cachin, C. (2016). "Architecture of the Hyperledger Blockchain Fabric." *Workshop on Distributed Cryptocurrencies and Consensus Ledgers*.

3. Ongaro, D., & Ousterhout, J. (2014). "In Search of an Understandable Consensus Algorithm." *USENIX ATC 2014*.

4. Castro, M., & Liskov, B. (1999). "Practical Byzantine Fault Tolerance." *OSDI 1999*.

5. Hyperledger Fabric Documentation. (2024). "The Ordering Service." https://hyperledger-fabric.readthedocs.io/

---

## Appendix A: Consensus Verification Commands

```bash
# Verify endorsement policy
peer lifecycle chaincode querycommitted \
  --channelID healthcarechannel \
  --name healthcare

# Check block structure
peer channel fetch newest block.pb \
  -c healthcarechannel \
  -o localhost:7050

# Decode block
configtxlator proto_decode \
  --input block.pb \
  --type common.Block

# View transaction validation codes
peer channel fetch <block_num> \
  -c healthcarechannel | \
  jq '.data.data[].payload.data.actions[].payload.action.endorsements'
```

## Appendix B: Consensus Monitoring

```javascript
// Monitor consensus events
const network = await gateway.getNetwork('healthcarechannel');
const contract = network.getContract('healthcare');

// Listen for block commit events
await contract.addBlockListener(
  async (event) => {
    console.log(`Block ${event.blockNumber} committed`);
    console.log(`Transactions: ${event.block.data.data.length}`);
    
    for (const tx of event.block.data.data) {
      console.log(`TX ${tx.payload.header.channel_header.tx_id}`);
      console.log(`Validation: ${tx.validationCode}`);
      console.log(`Endorsers: ${tx.endorsements.length}`);
    }
  },
  { type: 'full' }
);
```
