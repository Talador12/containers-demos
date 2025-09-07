# KV Storage Container Demo

This demo showcases how to use **Cloudflare Containers** with **Workers KV** API bindings for scalable key-value storage. The demo includes cache operations, session management, and batch processing using clean Container class helper methods.

## Features

- **KV API Bindings Integration** - Uses Container class helper methods for clean KV namespace access
- **Multiple KV Namespaces** - Demonstrates `DEMO_CACHE` and `USER_SESSIONS` namespaces
- **Cache Operations** - Store, retrieve, and delete cached values with TTL support
- **Session Management** - User session storage and retrieval
- **Batch Operations** - Process multiple KV operations efficiently
- **Container Helper Methods** - Leverages `getKvBindingInfo()`, `validateKvBindingEnvironment()`, and `getKvBindingSummary()`

## Setup

### 1. Create KV Namespaces

Create the required KV namespaces in your Cloudflare dashboard:

```bash
# Create production namespaces
wrangler kv:namespace create "DEMO_CACHE"
wrangler kv:namespace create "USER_SESSIONS"

# Create preview namespaces
wrangler kv:namespace create "DEMO_CACHE" --preview
wrangler kv:namespace create "USER_SESSIONS" --preview
```

### 2. Update Configuration

Update `wrangler.jsonc` with your KV namespace IDs:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "DEMO_CACHE",
      "id": "your-actual-namespace-id",
      "preview_id": "your-actual-preview-id"
    },
    {
      "binding": "USER_SESSIONS", 
      "id": "your-actual-sessions-namespace-id",
      "preview_id": "your-actual-sessions-preview-id"
    }
  ]
}
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy

```bash
# Development
npm run dev

# Production
npm run deploy
```

## Container Configuration

The Container class is configured with KV bindings that automatically generate environment variables:

```typescript
super(ctx, env, {
  defaultPort: 8080,
  kvBindings: [
    { binding: 'DEMO_CACHE', namespaceName: 'demo-cache', preview: 'demo-cache-preview' },
    { binding: 'USER_SESSIONS', namespaceName: 'user-sessions', preview: 'user-sessions-preview' }
  ]
});
```

This automatically creates these environment variables for the container:
- `KV_DEMO_CACHE_BINDING=DEMO_CACHE`
- `KV_DEMO_CACHE_NAMESPACE=demo-cache`
- `KV_DEMO_CACHE_PREVIEW=demo-cache-preview`
- `KV_USER_SESSIONS_BINDING=USER_SESSIONS`
- `KV_USER_SESSIONS_NAMESPACE=user-sessions`
- `KV_USER_SESSIONS_PREVIEW=user-sessions-preview`

## API Endpoints

### Health Check
```
GET /
```

### KV Binding Test
```
GET /kv-binding-test
```
Tests KV binding configuration using Container helper methods.

### Cache Operations
```
POST /cache/:key
Body: { "value": any, "ttl": number }
```
Store a value in the DEMO_CACHE namespace.

```
GET /cache/:key
```
Retrieve a value from the DEMO_CACHE namespace.

```
DELETE /cache/:key
```
Delete a value from the DEMO_CACHE namespace.

### Session Operations
```
POST /sessions/:sessionId
Body: { session data }
```
Store session data in the USER_SESSIONS namespace.

```
GET /sessions/:sessionId
```
Retrieve session data from the USER_SESSIONS namespace.

### Batch Operations
```
POST /batch
Body: {
  "operations": [
    { "type": "set", "namespace": "DEMO_CACHE", "key": "key1", "value": "value1" },
    { "type": "get", "namespace": "USER_SESSIONS", "key": "session123" }
  ]
}
```

## Container Helper Methods

This demo leverages the Container class helper methods for clean KV integration:

```javascript
// Get detailed KV binding information
const bindingInfo = global.container.getKvBindingInfo();

// Validate KV environment setup
const validation = global.container.validateKvBindingEnvironment();

// Get summary for logging/debugging
const summary = global.container.getKvBindingSummary();
```

**Before (Manual Approach):**
```javascript
// 40+ lines of manual environment variable parsing
const kvVars = {};
Object.keys(process.env).forEach(key => {
  if (key.startsWith('KV_')) {
    // Complex parsing and validation logic...
  }
});
```

**After (Container Helper Methods):**
```javascript
// Clean 3-line Container API usage
const bindingInfo = global.container.getKvBindingInfo();
const validation = global.container.validateKvBindingEnvironment();
const summary = global.container.getKvBindingSummary();
```

## Example Usage

### Store Cache Value
```bash
curl -X POST http://localhost:8080/cache/user:123 \
  -H "Content-Type: application/json" \
  -d '{"value": {"name": "John", "role": "admin"}, "ttl": 3600}'
```

### Retrieve Cache Value
```bash
curl http://localhost:8080/cache/user:123
```

### Store Session
```bash
curl -X POST http://localhost:8080/sessions/sess_abc123 \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_456", "permissions": ["read", "write"]}'
```

### Batch Operations
```bash
curl -X POST http://localhost:8080/batch \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"type": "set", "namespace": "DEMO_CACHE", "key": "config", "value": {"theme": "dark"}},
      {"type": "get", "namespace": "USER_SESSIONS", "key": "sess_abc123"}
    ]
  }'
```

## Expected Logs

When the container starts, you should see:

```
=== KV Binding Environment Variables ===
KV_DEMO_CACHE_BINDING=DEMO_CACHE
KV_DEMO_CACHE_NAMESPACE=demo-cache
KV_DEMO_CACHE_PREVIEW=demo-cache-preview
KV_USER_SESSIONS_BINDING=USER_SESSIONS
KV_USER_SESSIONS_NAMESPACE=user-sessions
KV_USER_SESSIONS_PREVIEW=user-sessions-preview
Found 6 KV environment variables

🚀 KV Storage Container running on port 8080

📊 Container KV Binding Summary:
  Configured bindings: 2
  - DEMO_CACHE -> demo-cache (preview: demo-cache-preview)
  - USER_SESSIONS -> user-sessions (preview: user-sessions-preview)
```

## Architecture

This demo demonstrates the **KV API binding approach** where:

1. **Container Class** handles KV binding environment variable generation and validation
2. **Helper Methods** provide clean APIs for KV binding management
3. **Container Application** focuses on business logic rather than binding configuration
4. **Workers KV Namespaces** store actual key-value data with optimal performance

## Benefits

- **Improved Developer Experience** - Clean Container helper methods vs manual parsing
- **Automatic Environment Setup** - KV binding variables generated automatically  
- **Multiple Namespace Support** - Easy configuration for different data types
- **Production Ready** - Proper error handling and validation
- **Scalable** - Leverages Workers KV performance and global distribution
