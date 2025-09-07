const express = require('express');

const app = express();
const port = 8080;

// Log all KV environment variables on startup
console.log('=== KV Binding Environment Variables ===');
const kvEnvVars = Object.keys(process.env).filter(key => key.startsWith('KV_'));
kvEnvVars.forEach(key => {
  console.log(`${key}=${process.env[key]}`);
});

if (kvEnvVars.length === 0) {
  console.log('  No KV environment variables found');
} else {
  console.log(`  Found ${kvEnvVars.length} KV environment variables`);
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'kv-storage-container',
    port: port,
    endpoints: [
      'GET / - Health check',
      'GET /kv-binding-test - Test KV binding configuration',
      'POST /cache/:key - Store value in DEMO_CACHE namespace',
      'GET /cache/:key - Retrieve value from DEMO_CACHE namespace',
      'DELETE /cache/:key - Delete value from DEMO_CACHE namespace',
      'POST /sessions/:sessionId - Store session data',
      'GET /sessions/:sessionId - Retrieve session data'
    ]
  });
});

// KV binding test endpoint - uses Container helper methods
app.get('/kv-binding-test', (req, res) => {
  console.log('\n=== KV Binding Test ===');

  try {
    // Use Container class helper methods for clean KV integration
    const bindingInfo = global.container.getKvBindingInfo();
    const validation = global.container.validateKvBindingEnvironment();
    const summary = global.container.getKvBindingSummary();

    console.log('KV Binding Info:', JSON.stringify(bindingInfo, null, 2));
    console.log('KV Binding Validation:', JSON.stringify(validation, null, 2));
    console.log('KV Binding Summary:', JSON.stringify(summary, null, 2));

    res.json({
      success: true,
      message: 'KV binding test completed using Container helper methods',
      bindingInfo,
      validation,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during KV binding test:', error);
    res.status(500).json({
      success: false,
      error: 'KV binding test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache operations using DEMO_CACHE namespace
app.post('/cache/:key', express.json(), (req, res) => {
  const { key } = req.params;
  const { value, ttl } = req.body;

  if (!value) {
    return res.status(400).json({ error: 'Value is required' });
  }

  console.log(`Storing in cache: ${key} = ${JSON.stringify(value)}`);
  console.log(`TTL: ${ttl || 'No expiration'}`);

  // Simulate KV storage operation
  res.json({
    success: true,
    message: `Value stored in DEMO_CACHE namespace`,
    key,
    value,
    ttl: ttl || null,
    timestamp: new Date().toISOString()
  });
});

app.get('/cache/:key', (req, res) => {
  const { key } = req.params;

  console.log(`Retrieving from cache: ${key}`);

  // Simulate KV retrieval operation
  res.json({
    success: true,
    message: `Value retrieved from DEMO_CACHE namespace`,
    key,
    value: `simulated-value-for-${key}`,
    timestamp: new Date().toISOString()
  });
});

app.delete('/cache/:key', (req, res) => {
  const { key } = req.params;

  console.log(`Deleting from cache: ${key}`);

  // Simulate KV deletion operation
  res.json({
    success: true,
    message: `Value deleted from DEMO_CACHE namespace`,
    key,
    timestamp: new Date().toISOString()
  });
});

// Session operations using USER_SESSIONS namespace
app.post('/sessions/:sessionId', express.json(), (req, res) => {
  const { sessionId } = req.params;
  const sessionData = req.body;

  console.log(`Storing session: ${sessionId} = ${JSON.stringify(sessionData)}`);

  // Simulate session storage operation
  res.json({
    success: true,
    message: `Session stored in USER_SESSIONS namespace`,
    sessionId,
    data: sessionData,
    timestamp: new Date().toISOString()
  });
});

app.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  console.log(`Retrieving session: ${sessionId}`);

  // Simulate session retrieval operation
  res.json({
    success: true,
    message: `Session retrieved from USER_SESSIONS namespace`,
    sessionId,
    data: {
      userId: `user-${sessionId}`,
      createdAt: new Date().toISOString(),
      lastAccess: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

// Batch operations endpoint
app.post('/batch', express.json(), (req, res) => {
  const { operations } = req.body;

  if (!operations || !Array.isArray(operations)) {
    return res.status(400).json({ error: 'Operations array is required' });
  }

  console.log(`Processing ${operations.length} batch operations`);

  const results = operations.map(op => {
    console.log(`Batch operation: ${op.type} ${op.namespace}:${op.key}`);
    return {
      operation: op,
      success: true,
      result: `Batch ${op.type} operation completed`
    };
  });

  res.json({
    success: true,
    message: `${operations.length} batch operations completed`,
    results,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`\n🚀 KV Storage Container running on port ${port}`);
  console.log(`Container Process ID: ${process.pid}`);
  
  if (global.container) {
    console.log('\n📊 Container KV Binding Summary:');
    try {
      const summary = global.container.getKvBindingSummary();
      console.log(`  Configured bindings: ${summary.configured}`);
      summary.bindings.forEach(binding => {
        console.log(`  - ${binding.name} -> ${binding.namespace}${binding.preview ? ` (preview: ${binding.preview})` : ''}`);
      });
    } catch (error) {
      console.log('  Unable to get KV binding summary:', error.message);
    }
  }
  
  console.log('\n📋 Available endpoints:');
  console.log('  GET  /                     - Health check');
  console.log('  GET  /kv-binding-test      - Test KV bindings');
  console.log('  POST /cache/:key           - Store cache value');
  console.log('  GET  /cache/:key           - Retrieve cache value');
  console.log('  DELETE /cache/:key         - Delete cache value');
  console.log('  POST /sessions/:sessionId  - Store session data');
  console.log('  GET  /sessions/:sessionId  - Retrieve session data');
  console.log('  POST /batch                - Batch operations');
});
