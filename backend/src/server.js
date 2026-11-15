const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');

const pool = require('./config/database');

const userRoutes = require('./routes/userRoutes');
const grievanceRoutes = require('./routes/grievanceRoutes');
const geminiRoutes = require('./routes/geminiRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ResolveAI backend is running'
  });
});

app.get('/api/db-check', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    res.status(200).json({
      success: true,
      message: 'MySQL database connected successfully'
    });
  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to connect to MySQL database'
    });
  }
});

app.use('/api/users', userRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/ai', geminiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`ResolveAI backend running on port ${PORT}`);
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error('');
    console.error(`Port ${PORT} is already in use.`);
    console.error('Another copy of the backend is probably still running.');
    console.error('');
    console.error('Find and stop the process holding the port:');
    console.error(
      `  Get-NetTCPConnection -State Listen -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
    );
    console.error('');
    console.error('Or run this server on a different port:');
    console.error('  $env:PORT=5001; npm start');
    console.error('');

    process.exit(1);
  }

  throw error;
});