import { Container } from '@cloudflare/containers';

interface Env {
  // Define your environment variables here
}

export class ExecContainer extends Container<Env> {
  constructor(ctx: DurableObject['ctx'], env: Env) {
    super(ctx, env, {
      defaultPort: 8080,
      sleepAfter: '10m'
    });
  }

  /**
   * Main request handler
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (path) {
        case '/':
          return this.handleHome();
        case '/exec':
          return this.handleExecAPI(request);
        case '/examples':
          return this.handleExamples();
        case '/status':
          return this.handleStatus();
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Request error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private handleHome(): Response {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Container Exec Demo</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 10px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
        .exec-section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff; }
        .command-input { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 5px; font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; margin-bottom: 10px; }
        .options-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .option-group { }
        .option-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        .option-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .execute-btn { background: #28a745; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold; }
        .execute-btn:hover { background: #218838; }
        .execute-btn:disabled { background: #6c757d; cursor: not-allowed; }
        .result-section { margin-top: 20px; padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 5px; }
        .result-header { font-weight: bold; color: #333; margin-bottom: 10px; }
        .result-content { font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; white-space: pre-wrap; }
        .stdout { color: #28a745; background: #f8fff8; padding: 10px; border-radius: 4px; margin: 5px 0; }
        .stderr { color: #dc3545; background: #fff8f8; padding: 10px; border-radius: 4px; margin: 5px 0; }
        .exit-code { color: #6c757d; margin: 10px 0; }
        .examples-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
        .example-card { background: #e9ecef; padding: 15px; border-radius: 5px; cursor: pointer; transition: background 0.2s; }
        .example-card:hover { background: #dee2e6; }
        .example-title { font-weight: bold; color: #495057; margin-bottom: 5px; }
        .example-command { font-family: 'Consolas', 'Monaco', monospace; color: #007bff; font-size: 12px; }
        .loading { color: #007bff; font-style: italic; }
        .error { color: #dc3545; background: #fff5f5; padding: 10px; border-radius: 4px; border-left: 4px solid #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐳 Container Exec Demo</h1>
        <p class="subtitle">Execute commands in your container with a simple, powerful API</p>
        
        <div class="exec-section">
            <h3>💻 Execute Command</h3>
            <input type="text" id="commandInput" class="command-input" placeholder="Enter command (e.g., 'echo Hello World' or 'ls -la')" value="echo 'Hello from container exec!'">
            
            <div class="options-grid">
                <div class="option-group">
                    <label for="workingDir">Working Directory:</label>
                    <input type="text" id="workingDir" class="option-input" placeholder="/app">
                </div>
                <div class="option-group">
                    <label for="envVars">Environment Variables:</label>
                    <input type="text" id="envVars" class="option-input" placeholder="NODE_ENV=production,DEBUG=true">
                </div>
                <div class="option-group">
                    <label for="timeout">Timeout (ms):</label>
                    <input type="number" id="timeout" class="option-input" placeholder="30000" value="30000">
                </div>
            </div>
            
            <button id="executeBtn" class="execute-btn" onclick="executeCommand()">🚀 Execute Command</button>
            
            <div id="resultSection" class="result-section" style="display: none;">
                <div class="result-header">Execution Result:</div>
                <div id="resultContent" class="result-content"></div>
            </div>
        </div>
        
        <div class="exec-section">
            <h3>📚 Quick Examples</h3>
            <div class="examples-grid">
                <div class="example-card" onclick="setCommand('echo \\"Container exec is working!\\"')">
                    <div class="example-title">Basic Echo</div>
                    <div class="example-command">echo "Container exec is working!"</div>
                </div>
                <div class="example-card" onclick="setCommand('uname -a')">
                    <div class="example-title">System Info</div>
                    <div class="example-command">uname -a</div>
                </div>
                <div class="example-card" onclick="setCommand('ls -la /')">
                    <div class="example-title">List Root Directory</div>
                    <div class="example-command">ls -la /</div>
                </div>
                <div class="example-card" onclick="setCommand('ps aux')">
                    <div class="example-title">Process List</div>
                    <div class="example-command">ps aux</div>
                </div>
                <div class="example-card" onclick="setCommand('env | head -10')">
                    <div class="example-title">Environment Variables</div>
                    <div class="example-command">env | head -10</div>
                </div>
                <div class="example-card" onclick="setCommand('date && whoami')">
                    <div class="example-title">Date & User</div>
                    <div class="example-command">date && whoami</div>
                </div>
            </div>
        </div>
        
        <div class="exec-section">
            <h3>📖 API Usage</h3>
            <p>You can also use the exec API programmatically:</p>
            <div class="result-content" style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
// Basic usage
const result = await container.exec('echo "Hello World"');
console.log(result.stdout); // "Hello World"

// With options
const result = await container.exec('npm test', {
  workingDirectory: '/app',
  env: { NODE_ENV: 'test' },
  timeout: 60000
});

// Array command
const result = await container.exec(['ls', '-la', '/app']);
            </div>
        </div>
    </div>

    <script>
        function setCommand(command) {
            document.getElementById('commandInput').value = command;
        }
        
        async function executeCommand() {
            const command = document.getElementById('commandInput').value.trim();
            if (!command) {
                alert('Please enter a command');
                return;
            }
            
            const workingDir = document.getElementById('workingDir').value.trim();
            const envVarsStr = document.getElementById('envVars').value.trim();
            const timeout = parseInt(document.getElementById('timeout').value) || 30000;
            
            // Parse environment variables
            const env = {};
            if (envVarsStr) {
                envVarsStr.split(',').forEach(pair => {
                    const [key, value] = pair.split('=');
                    if (key && value) {
                        env[key.trim()] = value.trim();
                    }
                });
            }
            
            const options = {
                workingDirectory: workingDir || undefined,
                env: Object.keys(env).length > 0 ? env : undefined,
                timeout: timeout
            };
            
            const executeBtn = document.getElementById('executeBtn');
            const resultSection = document.getElementById('resultSection');
            const resultContent = document.getElementById('resultContent');
            
            executeBtn.disabled = true;
            executeBtn.textContent = '⏳ Executing...';
            resultSection.style.display = 'block';
            resultContent.innerHTML = '<div class="loading">Executing command...</div>';
            
            try {
                const response = await fetch('/exec', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command, options })
                });
                
                const result = await response.json();
                
                let html = \`<div class="exit-code">Exit Code: \${result.exitCode} | Duration: \${result.duration}ms | Success: \${result.success}</div>\`;
                
                if (result.stdout) {
                    html += \`<div class="stdout"><strong>STDOUT:</strong><br>\${result.stdout}</div>\`;
                }
                
                if (result.stderr) {
                    html += \`<div class="stderr"><strong>STDERR:</strong><br>\${result.stderr}</div>\`;
                }
                
                if (!result.stdout && !result.stderr) {
                    html += '<div style="color: #6c757d; font-style: italic;">No output</div>';
                }
                
                resultContent.innerHTML = html;
            } catch (error) {
                resultContent.innerHTML = \`<div class="error">Error: \${error.message}</div>\`;
            } finally {
                executeBtn.disabled = false;
                executeBtn.textContent = '🚀 Execute Command';
            }
        }
        
        // Allow Enter key to execute
        document.getElementById('commandInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                executeCommand();
            }
        });
    </script>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  private async handleExecAPI(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { command, options } = await request.json() as {
        command: string | string[];
        options?: {
          workingDirectory?: string;
          env?: Record<string, string>;
          timeout?: number;
        };
      };

      if (!command) {
        return new Response(JSON.stringify({ error: 'Command is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Execute the command using the container's exec method
      const result = await this.exec(command, options);

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ 
        error: errorMessage,
        exitCode: 1,
        success: false 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private handleExamples(): Response {
    const examples = [
      {
        title: "System Information",
        commands: [
          { desc: "OS and kernel info", cmd: "uname -a" },
          { desc: "System uptime", cmd: "uptime" },
          { desc: "Memory usage", cmd: "free -h" },
          { desc: "Disk usage", cmd: "df -h" }
        ]
      },
      {
        title: "Process Management",
        commands: [
          { desc: "List all processes", cmd: "ps aux" },
          { desc: "Current user", cmd: "whoami" },
          { desc: "Current directory", cmd: "pwd" },
          { desc: "Environment variables", cmd: "env | head -20" }
        ]
      },
      {
        title: "File Operations",
        commands: [
          { desc: "List root directory", cmd: "ls -la /" },
          { desc: "Find files", cmd: "find /usr -name '*.conf' | head -10" },
          { desc: "File permissions", cmd: "ls -la /etc/passwd" },
          { desc: "Disk usage by directory", cmd: "du -sh /* 2>/dev/null | head -10" }
        ]
      },
      {
        title: "Network & Connectivity",
        commands: [
          { desc: "Network interfaces", cmd: "ip addr show" },
          { desc: "Test HTTP request", cmd: "curl -s -o /dev/null -w '%{http_code}' https://httpbin.org/status/200" },
          { desc: "DNS resolution", cmd: "nslookup google.com" }
        ]
      }
    ];

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Container Exec Examples</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .example-section { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .command-item { margin: 15px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #007bff; }
        .command-desc { font-weight: bold; color: #333; margin-bottom: 5px; }
        .command-code { font-family: 'Consolas', 'Monaco', monospace; background: #f1f3f4; padding: 8px; border-radius: 4px; color: #d73a49; }
        .back-link { display: inline-block; margin-bottom: 20px; color: #007bff; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <a href="/" class="back-link">← Back to Exec Demo</a>
    <h1>Container Exec Examples</h1>
    
    ${examples.map(section => `
      <div class="example-section">
        <h2>${section.title}</h2>
        ${section.commands.map(cmd => `
          <div class="command-item">
            <div class="command-desc">${cmd.desc}</div>
            <div class="command-code">${cmd.cmd}</div>
          </div>
        `).join('')}
      </div>
    `).join('')}
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  private async handleStatus(): Response {
    const state = await this.getState();
    
    const status = {
      containerState: state,
      currentTime: new Date().toISOString(),
      sleepAfter: this.sleepAfter,
      defaultPort: this.defaultPort,
      lastChange: new Date(state.lastChange).toISOString(),
      uptime: `${Math.round((Date.now() - state.lastChange) / 1000)}s`
    };

    return new Response(JSON.stringify(status, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Export the Durable Object
export { ExecContainer as default };
