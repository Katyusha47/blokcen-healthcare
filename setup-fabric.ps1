# Hyperledger Fabric Setup Script for Windows
# This script automates the Hyperledger Fabric setup process

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Hyperledger Fabric Setup for Healthcare Blockchain" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($command) {
    try {
        if (Get-Command $command -ErrorAction Stop) {
            return $true
        }
    } catch {
        return $false
    }
}

# Step 1: Check Prerequisites
Write-Host "[1/10] Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
if (Test-Command "docker") {
    Write-Host "  ✓ Docker installed" -ForegroundColor Green
    docker --version
} else {
    Write-Host "  ✗ Docker NOT installed!" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "  ✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Docker is not running!" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop and try again" -ForegroundColor Red
    exit 1
}

# Check Git
if (Test-Command "git") {
    Write-Host "  ✓ Git installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Git NOT installed!" -ForegroundColor Red
    Write-Host "  Please install Git from: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Check Node.js
if (Test-Command "node") {
    Write-Host "  ✓ Node.js installed" -ForegroundColor Green
    node --version
} else {
    Write-Host "  ✗ Node.js NOT installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js from: https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Create Fabric Directory
Write-Host "[2/10] Creating Fabric directory..." -ForegroundColor Yellow
$fabricDir = "F:\fabric"
if (-not (Test-Path $fabricDir)) {
    New-Item -ItemType Directory -Path $fabricDir | Out-Null
    Write-Host "  ✓ Created directory: $fabricDir" -ForegroundColor Green
} else {
    Write-Host "  ✓ Directory already exists: $fabricDir" -ForegroundColor Green
}

Set-Location $fabricDir
Write-Host ""

# Step 3: Download Fabric Samples
Write-Host "[3/10] Downloading Fabric samples (this may take a while)..." -ForegroundColor Yellow
if (-not (Test-Path "$fabricDir\fabric-samples")) {
    Write-Host "  Downloading Fabric binaries and Docker images..." -ForegroundColor Cyan
    Write-Host "  This will take 5-10 minutes depending on your internet speed..." -ForegroundColor Cyan
    
    # Download using curl
    curl -sSL https://bit.ly/2ysbOFE -o bootstrap.sh
    bash bootstrap.sh 2.5.0 1.5.5
    
    if (Test-Path "$fabricDir\fabric-samples") {
        Write-Host "  ✓ Fabric samples downloaded successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to download Fabric samples" -ForegroundColor Red
        Write-Host "  Please download manually from: https://github.com/hyperledger/fabric-samples" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✓ Fabric samples already exist" -ForegroundColor Green
}
Write-Host ""

# Step 4: Add binaries to PATH
Write-Host "[4/10] Configuring PATH..." -ForegroundColor Yellow
$fabricBinPath = "$fabricDir\fabric-samples\bin"
if ($env:Path -notlike "*$fabricBinPath*") {
    $env:Path += ";$fabricBinPath"
    Write-Host "  ✓ Added Fabric binaries to PATH (current session)" -ForegroundColor Green
    Write-Host "  NOTE: Add permanently via System Properties > Environment Variables" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Fabric binaries already in PATH" -ForegroundColor Green
}
Write-Host ""

# Step 5: Copy chaincode
Write-Host "[5/10] Copying chaincode..." -ForegroundColor Yellow
$chaincodeSource = "F:\laragon\www\blokcen\fabric-network\chaincode"
$chaincodeDest = "$fabricDir\fabric-samples\chaincode\healthcare"

if (Test-Path $chaincodeSource) {
    if (-not (Test-Path $chaincodeDest)) {
        New-Item -ItemType Directory -Path $chaincodeDest -Force | Out-Null
    }
    Copy-Item -Path "$chaincodeSource\*" -Destination $chaincodeDest -Recurse -Force
    Write-Host "  ✓ Chaincode copied to: $chaincodeDest" -ForegroundColor Green
} else {
    Write-Host "  ✗ Chaincode source not found: $chaincodeSource" -ForegroundColor Red
}
Write-Host ""

# Step 6: Clean previous network
Write-Host "[6/10] Cleaning any previous network..." -ForegroundColor Yellow
Set-Location "$fabricDir\fabric-samples\test-network"
.\network.sh down 2>&1 | Out-Null
Write-Host "  ✓ Previous network cleaned" -ForegroundColor Green
Write-Host ""

# Step 7: Start network
Write-Host "[7/10] Starting Fabric network..." -ForegroundColor Yellow
Write-Host "  This may take 2-3 minutes..." -ForegroundColor Cyan
.\network.sh up createChannel -c healthcarechannel -ca

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Fabric network started successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to start network" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 8: Verify containers
Write-Host "[8/10] Verifying Docker containers..." -ForegroundColor Yellow
$containers = docker ps --format "{{.Names}}"
$expectedContainers = @("orderer.example.com", "peer0.org1.example.com", "peer0.org2.example.com")

foreach ($expected in $expectedContainers) {
    if ($containers -contains $expected) {
        Write-Host "  ✓ $expected is running" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $expected is NOT running" -ForegroundColor Red
    }
}
Write-Host ""

# Step 9: Deploy chaincode
Write-Host "[9/10] Deploying chaincode..." -ForegroundColor Yellow
Write-Host "  This process involves multiple steps..." -ForegroundColor Cyan

# Package chaincode
Write-Host "  - Packaging chaincode..." -ForegroundColor Cyan
peer lifecycle chaincode package healthcare.tar.gz --path ../chaincode/healthcare --lang node --label healthcare_1.0

if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✓ Chaincode packaged" -ForegroundColor Green
} else {
    Write-Host "    ✗ Failed to package chaincode" -ForegroundColor Red
    exit 1
}

# Install on Org1
Write-Host "  - Installing on Org1..." -ForegroundColor Cyan
$env:CORE_PEER_TLS_ENABLED = "true"
$env:CORE_PEER_LOCALMSPID = "Org1MSP"
$env:CORE_PEER_TLS_ROOTCERT_FILE = "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\peers\peer0.org1.example.com\tls\ca.crt"
$env:CORE_PEER_MSPCONFIGPATH = "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\users\Admin@org1.example.com\msp"
$env:CORE_PEER_ADDRESS = "localhost:7051"

peer lifecycle chaincode install healthcare.tar.gz

# Install on Org2
Write-Host "  - Installing on Org2..." -ForegroundColor Cyan
$env:CORE_PEER_LOCALMSPID = "Org2MSP"
$env:CORE_PEER_TLS_ROOTCERT_FILE = "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\peers\peer0.org2.example.com\tls\ca.crt"
$env:CORE_PEER_MSPCONFIGPATH = "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\users\Admin@org2.example.com\msp"
$env:CORE_PEER_ADDRESS = "localhost:9051"

peer lifecycle chaincode install healthcare.tar.gz

# Get package ID
Write-Host "  - Getting package ID..." -ForegroundColor Cyan
$packageId = (peer lifecycle chaincode queryinstalled | Select-String -Pattern "healthcare_1.0:([a-f0-9]+)" | ForEach-Object { $_.Matches.Value })
Write-Host "    Package ID: $packageId" -ForegroundColor Cyan

if ($packageId) {
    # Approve for Org1
    Write-Host "  - Approving for Org1..." -ForegroundColor Cyan
    $env:CORE_PEER_LOCALMSPID = "Org1MSP"
    $env:CORE_PEER_TLS_ROOTCERT_FILE = "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\peers\peer0.org1.example.com\tls\ca.crt"
    $env:CORE_PEER_MSPCONFIGPATH = "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\users\Admin@org1.example.com\msp"
    $env:CORE_PEER_ADDRESS = "localhost:7051"
    
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID healthcarechannel --name healthcare --version 1.0 --package-id $packageId --sequence 1 --tls --cafile "$fabricDir\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem"
    
    # Approve for Org2
    Write-Host "  - Approving for Org2..." -ForegroundColor Cyan
    $env:CORE_PEER_LOCALMSPID = "Org2MSP"
    $env:CORE_PEER_TLS_ROOTCERT_FILE = "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\peers\peer0.org2.example.com\tls\ca.crt"
    $env:CORE_PEER_MSPCONFIGPATH = "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\users\Admin@org2.example.com\msp"
    $env:CORE_PEER_ADDRESS = "localhost:9051"
    
    peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID healthcarechannel --name healthcare --version 1.0 --package-id $packageId --sequence 1 --tls --cafile "$fabricDir\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem"
    
    # Commit chaincode
    Write-Host "  - Committing chaincode..." -ForegroundColor Cyan
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID healthcarechannel --name healthcare --version 1.0 --sequence 1 --tls --cafile "$fabricDir\fabric-samples\test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\msp\tlscacerts\tlsca.example.com-cert.pem" --peerAddresses localhost:7051 --tlsRootCertFiles "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\peers\peer0.org1.example.com\tls\ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "$fabricDir\fabric-samples\test-network\organizations\peerOrganizations\org2.example.com\peers\peer0.org2.example.com\tls\ca.crt"
    
    Write-Host "  ✓ Chaincode deployed successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Could not get package ID" -ForegroundColor Red
}
Write-Host ""

# Step 10: Summary
Write-Host "[10/10] Setup complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "SETUP SUMMARY" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fabric Network Status:" -ForegroundColor Green
docker ps --format "table {{.Names}}\t{{.Status}}"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update your application's connection profile" -ForegroundColor White
Write-Host "2. Install Fabric SDK: cd F:\laragon\www\blokcen && npm install fabric-network fabric-ca-client" -ForegroundColor White
Write-Host "3. Start your application: npm start" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "- Stop network:    cd $fabricDir\fabric-samples\test-network && .\network.sh down" -ForegroundColor White
Write-Host "- View logs:       docker logs peer0.org1.example.com" -ForegroundColor White
Write-Host "- Check containers: docker ps" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: F:\laragon\www\blokcen\FABRIC_SETUP_COMPLETE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Setup completed successfully!" -ForegroundColor Green
