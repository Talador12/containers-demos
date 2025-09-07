import { Container } from '@cloudflare/containers';

// Demo Container that implements checkpointing endpoints
export class CheckpointDemoContainer extends Container<Env> {
  defaultPort = 8080;
  
  constructor(ctx: DurableObject['ctx'], env: Env) {
    super(ctx, env);
  }

  // Handle HTTP requests to the container
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    try {
      switch (url.pathname) {
        case '/':
          return this.handleHome();
          
        case '/data':
          if (request.method === 'GET') {
            return this.handleGetData();
          } else if (request.method === 'POST') {
            return this.handleSetData(request);
          }
          break;
          
        case '/checkpoint':
          if (request.method === 'POST') {
            return this.handleCreateCheckpoint(request);
          }
          break;
          
        case '/checkpoints':
          if (request.method === 'GET') {
            return this.handleListCheckpoints();
          }
          break;
          
        case '/restore':
          if (request.method === 'POST') {
            return this.handleRestore(request);
          }
          break;
          
        case '/cleanup':
          if (request.method === 'POST') {
            return this.handleCleanup();
          }
          break;
      }
      
      // Forward to container for other endpoints (including checkpoint endpoints)
      return await this.containerFetch(request);
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error', 
          message: error instanceof Error ? error.message : String(error) 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  private async handleHome(): Promise<Response> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Container Checkpointing Demo</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .button { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; margin: 5px; }
        .button:hover { background: #005a87; }
        .success { color: green; }
        .error { color: red; }
        textarea, input { width: 100%; padding: 8px; margin: 5px 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🗂️ Container Checkpointing Demo</h1>
    
    <div class="section">
        <h2>Current Data</h2>
        <div id="currentData">Loading...</div>
        <button class="button" onclick="refreshData()">Refresh Data</button>
    </div>
    
    <div class="section">
        <h2>Modify Data</h2>
        <textarea id="newData" placeholder="Enter JSON data..." rows="3">{"message": "Hello checkpoint world!", "timestamp": "${new Date().toISOString()}"}</textarea>
        <button class="button" onclick="setData()">Save Data</button>
    </div>
    
    <div class="section">
        <h2>Create Checkpoint</h2>
        <input type="text" id="checkpointPath" placeholder="Path to checkpoint (optional, defaults to entire container)" />
        <button class="button" onclick="createCheckpoint()">Create Checkpoint</button>
        <div id="checkpointResult"></div>
    </div>
    
    <div class="section">
        <h2>Available Checkpoints</h2>
        <button class="button" onclick="listCheckpoints()">Refresh List</button>
        <div id="checkpointsList">Click refresh to load checkpoints...</div>
    </div>
    
    <div class="section">
        <h2>Restore from Checkpoint</h2>
        <input type="text" id="restoreId" placeholder="Checkpoint ID" />
        <label><input type="checkbox" id="startAfterRestore" checked /> Start container after restore</label>
        <button class="button" onclick="restoreCheckpoint()">Restore</button>
        <div id="restoreResult"></div>
    </div>
    
    <div class="section">
        <h2>Cleanup</h2>
        <button class="button" onclick="cleanupExpired()">Clean Up Expired Checkpoints</button>
        <div id="cleanupResult"></div>
    </div>

    <script>
        async function refreshData() {
            try {
                const response = await fetch('/data');
                const data = await response.text();
                document.getElementById('currentData').innerHTML = '<pre>' + data + '</pre>';
            } catch (error) {
                document.getElementById('currentData').innerHTML = '<span class="error">Error loading data: ' + error.message + '</span>';
            }
        }
        
        async function setData() {
            try {
                const newData = document.getElementById('newData').value;
                const response = await fetch('/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: newData
                });
                if (response.ok) {
                    refreshData();
                } else {
                    throw new Error('Failed to save data');
                }
            } catch (error) {
                alert('Error saving data: ' + error.message);
            }
        }
        
        async function createCheckpoint() {
            try {
                const path = document.getElementById('checkpointPath').value;
                const body = path ? JSON.stringify({ path }) : '{}';
                
                const response = await fetch('/checkpoint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: body
                });
                
                const result = await response.json();
                if (response.ok) {
                    document.getElementById('checkpointResult').innerHTML = 
                        '<div class="success">Checkpoint created successfully!</div>' +
                        '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
                    listCheckpoints(); // Refresh the list
                } else {
                    throw new Error(result.message || 'Failed to create checkpoint');
                }
            } catch (error) {
                document.getElementById('checkpointResult').innerHTML = 
                    '<div class="error">Error creating checkpoint: ' + error.message + '</div>';
            }
        }
        
        async function listCheckpoints() {
            try {
                const response = await fetch('/checkpoints');
                const checkpoints = await response.json();
                
                if (checkpoints.length === 0) {
                    document.getElementById('checkpointsList').innerHTML = '<em>No checkpoints available</em>';
                } else {
                    let html = '<table border="1" style="width:100%; border-collapse: collapse;">';
                    html += '<tr><th>Checkpoint ID</th><th>Created</th><th>Size</th><th>Path</th><th>Actions</th></tr>';
                    
                    checkpoints.forEach(cp => {
                        html += '<tr>';
                        html += '<td><code>' + cp.checkpointId + '</code></td>';
                        html += '<td>' + new Date(cp.createdAt).toLocaleString() + '</td>';
                        html += '<td>' + Math.round(cp.sizeBytes / 1024) + ' KB</td>';
                        html += '<td>' + cp.originalPath + '</td>';
                        html += '<td><button class="button" onclick="document.getElementById(\\'restoreId\\').value=\\''+cp.checkpointId+'\\'; restoreCheckpoint()">Restore</button></td>';
                        html += '</tr>';
                    });
                    html += '</table>';
                    document.getElementById('checkpointsList').innerHTML = html;
                }
            } catch (error) {
                document.getElementById('checkpointsList').innerHTML = 
                    '<span class="error">Error loading checkpoints: ' + error.message + '</span>';
            }
        }
        
        async function restoreCheckpoint() {
            try {
                const checkpointId = document.getElementById('restoreId').value;
                const startAfterRestore = document.getElementById('startAfterRestore').checked;
                
                if (!checkpointId) {
                    alert('Please enter a checkpoint ID');
                    return;
                }
                
                const response = await fetch('/restore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ checkpointId, startAfterRestore })
                });
                
                const result = await response.json();
                if (response.ok) {
                    document.getElementById('restoreResult').innerHTML = 
                        '<div class="success">Restore completed successfully!</div>' +
                        '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
                    refreshData(); // Refresh data to show restored state
                } else {
                    throw new Error(result.message || 'Failed to restore checkpoint');
                }
            } catch (error) {
                document.getElementById('restoreResult').innerHTML = 
                    '<div class="error">Error restoring checkpoint: ' + error.message + '</div>';
            }
        }
        
        async function cleanupExpired() {
            try {
                const response = await fetch('/cleanup', { method: 'POST' });
                const result = await response.json();
                
                document.getElementById('cleanupResult').innerHTML = 
                    '<div class="success">Cleanup completed! Deleted ' + result.deletedCount + ' expired checkpoints.</div>';
                listCheckpoints(); // Refresh the list
            } catch (error) {
                document.getElementById('cleanupResult').innerHTML = 
                    '<div class="error">Error during cleanup: ' + error.message + '</div>';
            }
        }
        
        // Initial load
        refreshData();
        listCheckpoints();
    </script>
</body>
</html>`;
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  private async handleGetData(): Promise<Response> {
    try {
      // Simulate reading data from container filesystem
      const data = await this.containerFetch('/internal/data');
      return data;
    } catch {
      // Return default data if no data exists yet
      return new Response(JSON.stringify({ 
        message: "No data saved yet",
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleSetData(request: Request): Promise<Response> {
    try {
      const data = await request.json();
      
      // Forward to container to save data
      const response = await this.containerFetch('/internal/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Failed to save data',
        message: error instanceof Error ? error.message : String(error)
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleCreateCheckpoint(request: Request): Promise<Response> {
    try {
      const body = await request.json().catch(() => ({}));
      const result = await this.checkpoint(body);
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Checkpoint failed',
        message: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleListCheckpoints(): Promise<Response> {
    try {
      const checkpoints = await this.listCheckpoints();
      return new Response(JSON.stringify(checkpoints), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Failed to list checkpoints',
        message: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleRestore(request: Request): Promise<Response> {
    try {
      const { checkpointId, startAfterRestore } = await request.json();
      const result = await this.restore({ checkpointId, startAfterRestore });
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Restore failed',
        message: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleCleanup(): Promise<Response> {
    try {
      const deletedCount = await this.cleanupExpiredCheckpoints();
      return new Response(JSON.stringify({ deletedCount }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

// Worker environment interface
interface Env {
  CHECKPOINT_DEMO: DurableObjectNamespace<CheckpointDemoContainer>;
  CHECKPOINT_BUCKET?: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      // Get or create a Durable Object instance
      const id = env.CHECKPOINT_DEMO.idFromName('checkpoint-demo');
      const obj = env.CHECKPOINT_DEMO.get(id);
      
      return await obj.fetch(request);
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Service unavailable', 
          message: error instanceof Error ? error.message : String(error) 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};
