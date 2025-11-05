require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import routes
const authRoutes = require('./routes/authRoutes');
const recordRoutes = require('./routes/recordRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const auditRoutes = require('./routes/auditRoutes');

// Initialize Fabric connection
const fabricConnection = require('./config/fabric');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/audit', auditRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`� Environment: ${process.env.NODE_ENV}`);
  
  // Initialize Fabric connection
  console.log('🔗 Initializing Fabric connection...');
  const fabricConnected = await fabricConnection.initialize();
  
  if (fabricConnected) {
    console.log('✅ Fabric network connected successfully');
  } else {
    console.log('⚠️  Fabric not connected. App will run without blockchain features.');
  }
});
