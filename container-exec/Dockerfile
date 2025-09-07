# syntax=docker/dockerfile:1

FROM node:18-slim

# Install common CLI tools that might be useful for exec commands
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    net-tools \
    iputils-ping \
    dnsutils \
    procps \
    coreutils \
    findutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create the exec server application
RUN cat > server.js << 'EOF'
const http = require('http');
const { spawn } = require('child_process');
const { promisify } = require('util');

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle exec endpoint
  if (req.url === '/__exec' && req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          const result = await executeCommand(payload);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          console.error('Exec error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            exitCode: 1,
            stdout: '',
            stderr: error.message,
            duration: 0
          }));
        }
      });
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        exitCode: 1,
        stdout: '',
        stderr: 'Failed to process exec request',
        duration: 0
      }));
    }
    return;
  }

  // Handle regular HTTP requests
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Container Exec Demo Server\\nUse the /__exec endpoint for command execution');
});

async function executeCommand(payload) {
  const { command, workingDirectory, env, timeout = 30000 } = payload;
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const options = {
      cwd: workingDirectory || '/app',
      env: { ...process.env, ...(env || {}) },
      timeout: timeout,
      killSignal: 'SIGKILL'
    };

    console.log('Executing command:', command, 'with options:', options);

    const child = spawn(command[0], command.slice(1), options);
    
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code, signal) => {
      const duration = Date.now() - startTime;
      
      // Handle timeout
      if (signal === 'SIGKILL' && duration >= timeout - 100) {
        resolve({
          exitCode: 124,
          stdout: stdout,
          stderr: stderr + '\\nCommand timed out',
          duration: duration
        });
        return;
      }

      resolve({
        exitCode: code || 0,
        stdout: stdout,
        stderr: stderr,
        duration: duration
      });
    });

    child.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout: stdout,
        stderr: stderr + '\\nError: ' + error.message,
        duration: Date.now() - startTime
      });
    });

    // Set up timeout
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, timeout);
  });
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(\`Container exec server running on port \${PORT}\`);
  console.log('Ready to handle exec requests at /__exec');
});
EOF

EXPOSE 8080

CMD ["node", "server.js"]
