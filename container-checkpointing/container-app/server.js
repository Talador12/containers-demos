const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');

const app = express();
const port = 8080;

app.use(express.json());

// In-memory storage for demo data
let appData = {
  message: "Initial container data",
  timestamp: new Date().toISOString(),
  counter: 0
};

// Data storage path
const DATA_PATH = '/app/data';
const DATA_FILE = path.join(DATA_PATH, 'app-data.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.mkdir(DATA_PATH, { recursive: true });
    
    // Try to load existing data
    try {
      const existingData = await fs.readFile(DATA_FILE, 'utf8');
      appData = JSON.parse(existingData);
      console.log('Loaded existing data:', appData);
    } catch {
      // No existing data, use defaults
      await saveData();
    }
  } catch (error) {
    console.error('Error setting up data directory:', error);
  }
}

// Save data to filesystem
async function saveData() {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(appData, null, 2));
    console.log('Data saved to filesystem');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load data from filesystem
async function loadData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    appData = JSON.parse(data);
    console.log('Data loaded from filesystem');
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Internal data endpoints (used by the Container class)
app.get('/internal/data', async (req, res) => {
  await loadData();
  res.json(appData);
});

app.post('/internal/data', async (req, res) => {
  appData = { ...appData, ...req.body, timestamp: new Date().toISOString() };
  await saveData();
  res.json({ success: true });
});

// Checkpoint endpoint - creates a tar archive and uploads to R2
app.post('/__checkpoint', async (req, res) => {
  const { sourcePath = '/', r2Path, timeoutSeconds = 300 } = req.body;
  
  console.log(`Creating checkpoint: ${sourcePath} -> ${r2Path}`);
  
  try {
    // Create tar archive of the specified path
    const archivePath = '/tmp/checkpoint.tar.gz';
    const tarCommand = `tar -czf ${archivePath} -C ${sourcePath === '/' ? '' : path.dirname(sourcePath)} ${sourcePath === '/' ? '.' : path.basename(sourcePath)}`;
    
    console.log('Running tar command:', tarCommand);
    execSync(tarCommand, { timeout: timeoutSeconds * 1000 });
    
    // Get archive size
    const stats = await fs.stat(archivePath);
    const sizeBytes = stats.size;
    
    console.log(`Archive created: ${sizeBytes} bytes`);
    
    // Simulate R2 upload (in real implementation, use R2 API)
    // For demo purposes, we'll just move the file to a "backup" location
    const backupDir = '/app/backups';
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupPath = path.join(backupDir, `${path.basename(r2Path)}.tar.gz`);
    await fs.copyFile(archivePath, backupPath);
    await fs.unlink(archivePath); // Clean up temp file
    
    console.log(`Checkpoint saved to: ${backupPath}`);
    
    res.json({ sizeBytes });
  } catch (error) {
    console.error('Checkpoint failed:', error);
    res.status(500).json({ 
      error: 'Checkpoint failed', 
      message: error.message 
    });
  }
});

// Restore endpoint - downloads from R2 and extracts to filesystem
app.post('/__restore', async (req, res) => {
  const { r2Path, targetPath = '/', timeoutSeconds = 300 } = req.body;
  
  console.log(`Restoring checkpoint: ${r2Path} -> ${targetPath}`);
  
  try {
    // Simulate R2 download (find backup file)
    const backupDir = '/app/backups';
    const backupPath = path.join(backupDir, `${path.basename(r2Path)}.tar.gz`);
    
    // Check if backup exists
    try {
      await fs.access(backupPath);
    } catch {
      throw new Error(`Checkpoint not found: ${r2Path}`);
    }
    
    // Get archive size
    const stats = await fs.stat(backupPath);
    const sizeBytes = stats.size;
    
    // Extract archive to target path
    const extractCommand = `tar -xzf ${backupPath} -C ${targetPath === '/' ? '/' : path.dirname(targetPath)}`;
    
    console.log('Running extract command:', extractCommand);
    execSync(extractCommand, { timeout: timeoutSeconds * 1000 });
    
    // Reload data after restore
    await loadData();
    
    console.log(`Checkpoint restored from: ${backupPath}`);
    
    res.json({ sizeBytes });
  } catch (error) {
    console.error('Restore failed:', error);
    res.status(500).json({ 
      error: 'Restore failed', 
      message: error.message 
    });
  }
});

// Delete checkpoint endpoint
app.post('/__delete-checkpoint', async (req, res) => {
  const { r2Path } = req.body;
  
  console.log(`Deleting checkpoint: ${r2Path}`);
  
  try {
    // Simulate R2 delete (remove backup file)
    const backupDir = '/app/backups';
    const backupPath = path.join(backupDir, `${path.basename(r2Path)}.tar.gz`);
    
    try {
      await fs.unlink(backupPath);
      console.log(`Checkpoint deleted: ${backupPath}`);
    } catch {
      // File doesn't exist, that's fine
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete failed:', error);
    res.status(500).json({ 
      error: 'Delete failed', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    data: appData
  });
});

// Status endpoint for monitoring
app.get('/status', async (req, res) => {
  try {
    // List available backups
    const backupDir = '/app/backups';
    let backups = [];
    
    try {
      const files = await fs.readdir(backupDir);
      for (const file of files) {
        if (file.endsWith('.tar.gz')) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          backups.push({
            name: file,
            size: stats.size,
            created: stats.birthtime
          });
        }
      }
    } catch {
      // Backup directory doesn't exist yet
    }
    
    res.json({
      status: 'running',
      data: appData,
      dataFile: DATA_FILE,
      backups: backups,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
async function startServer() {
  await ensureDataDirectory();
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`Container app listening on port ${port}`);
    console.log('Available endpoints:');
    console.log('  GET  /health - Health check');
    console.log('  GET  /status - Status and backup info');
    console.log('  GET  /internal/data - Get app data');
    console.log('  POST /internal/data - Set app data');
    console.log('  POST /__checkpoint - Create checkpoint');
    console.log('  POST /__restore - Restore checkpoint');
    console.log('  POST /__delete-checkpoint - Delete checkpoint');
  });
}

startServer().catch(console.error);
