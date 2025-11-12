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