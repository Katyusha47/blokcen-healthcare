#!/bin/bash

# Healthcare Blockchain - Hyperledger Fabric Network Startup Script

echo "================================================"
echo "Healthcare Blockchain - Fabric Network Setup"
echo "================================================"

# Set environment variables
export FABRIC_CFG_PATH=$PWD
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_ADDRESS=localhost:7051

echo ""
echo "Step 1: Starting Fabric Network..."
echo "-----------------------------------"

# Start the network using docker-compose
# Note: You need to have docker-compose.yaml file configured
docker-compose -f docker-compose.yaml up -d

sleep 5

echo ""
echo "Step 2: Creating Channel..."
echo "---------------------------"

# Create channel
peer channel create -o localhost:7050 -c healthcarechannel -f ./channel-artifacts/healthcarechannel.tx

# Join peer to channel
peer channel join -b healthcarechannel.block

sleep 3

echo ""
echo "Step 3: Installing Chaincode..."
echo "--------------------------------"

# Package chaincode
peer lifecycle chaincode package medicalrecords.tar.gz --path ./chaincode --lang node --label medicalrecords_1

# Install chaincode
peer lifecycle chaincode install medicalrecords.tar.gz

sleep 3

echo ""
echo "Step 4: Approving and Committing Chaincode..."
echo "----------------------------------------------"

# Get package ID
export CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep medicalrecords_1 | awk '{print $3}' | sed 's/,$//')

# Approve chaincode
peer lifecycle chaincode approveformyorg -o localhost:7050 --channelID healthcarechannel --name medicalrecords --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1

# Commit chaincode
peer lifecycle chaincode commit -o localhost:7050 --channelID healthcarechannel --name medicalrecords --version 1.0 --sequence 1

sleep 3

echo ""
echo "Step 5: Initializing Chaincode..."
echo "----------------------------------"

# Invoke init
peer chaincode invoke -o localhost:7050 -C healthcarechannel -n medicalrecords -c '{"function":"initLedger","Args":[]}'

echo ""
echo "================================================"
echo "✅ Fabric Network Setup Complete!"
echo "================================================"
echo ""
echo "Network is ready for Healthcare Blockchain application."
echo "You can now start the Express.js server."
echo ""
