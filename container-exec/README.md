# Container Exec Demo

This demo showcases the `container.exec()` functionality, allowing you to execute arbitrary commands inside running containers with a simple, clean API.

## Features

- **Simple API**: Just `await container.exec('your command')` - no manual container state checking required
- **Automatic Container Management**: The container is automatically started if not running
- **Rich Command Support**: Execute both string commands and command arrays
- **Comprehensive Results**: Get stdout, stderr, exit codes, and execution duration
- **Error Handling**: Graceful handling of timeouts, network errors, and command failures
- **Flexible Options**: Working directory, environment variables, and custom timeouts

## Usage Examples

### Basic Command Execution
```typescript
const result = await container.exec('echo "Hello from container!"');
console.log(result.stdout); // "Hello from container!"
```

### Command with Options
```typescript
const result = await container.exec('echo $NODE_ENV', {
  env: { NODE_ENV: 'production' },
  workingDirectory: '/app',
  timeout: 5000
});
```

### Array Commands
```typescript
const result = await container.exec(['ls', '-la', '/app']);
```

## Demo Endpoints

- `GET /` - Interactive web interface for testing exec commands
- `POST /exec` - API endpoint for executing commands
- `GET /examples` - Pre-built command examples
- `GET /status` - Container and execution status

## Running the Demo

```bash
npm install
npm run dev
```

Then visit http://localhost:8787 to interact with the container exec demo.

## Container Setup

The demo uses a simple Node.js container that:
- Listens on port 8080 for HTTP requests
- Implements the `/__exec` endpoint for command execution
- Provides a clean execution environment with common CLI tools

## Command Examples to Try

- **System Info**: `uname -a`
- **File System**: `ls -la /`
- **Environment**: `env | grep NODE`
- **Process List**: `ps aux`
- **Network**: `curl -s https://httpbin.org/json`
- **Custom Script**: `echo "console.log('Hello from Node!')" | node`

## Error Handling

The exec API gracefully handles various error scenarios:
- **Command not found**: Returns exit code 127 with appropriate stderr
- **Timeout**: Returns exit code 124 with "Command timed out" message
- **Network errors**: Returns exit code 1 with connection error details
- **Container failures**: Automatically attempts to restart and retry
