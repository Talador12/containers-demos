/**
 * Container application demonstrating Secrets Store integration
 * This runs inside the container and provides API endpoints for secret management
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API endpoint: Get secrets information
app.get('/api/secrets/info', (req, res) => {
  try {
    // Parse secrets store environment variables
    const secretsInfo = {};
    
    // Find all SECRETS_* environment variables
    const secretsVars = Object.keys(process.env)
      .filter(key => key.startsWith('SECRETS_'))
      .reduce((obj, key) => {
        obj[key] = process.env[key];
        return obj;
      }, {});

    // Group by binding name
    const bindingGroups = {};
    Object.keys(secretsVars).forEach(key => {
      const match = key.match(/^SECRETS_([A-Z0-9_]+)_(BINDING|STORE_ID|SECRET_NAME)$/);
      if (match) {
        const bindingName = match[1];
        const varType = match[2];
        
        if (!bindingGroups[bindingName]) {
          bindingGroups[bindingName] = {};
        }
        bindingGroups[bindingName][varType] = secretsVars[key];
      }
    });

    // Format response
    Object.keys(bindingGroups).forEach(bindingName => {
      const group = bindingGroups[bindingName];
      if (group.BINDING) {
        secretsInfo[group.BINDING] = {
          binding: group.BINDING,
          storeId: group.STORE_ID || 'unknown',
          secretName: group.SECRET_NAME || 'unknown',
          envVars: {
            [`SECRETS_${bindingName}_BINDING`]: group.BINDING,
            [`SECRETS_${bindingName}_STORE_ID`]: group.STORE_ID,
            [`SECRETS_${bindingName}_SECRET_NAME`]: group.SECRET_NAME
          }
        };
      }
    });

    res.json({
      message: 'Container-generated secrets info using environment variables',
      containerMethod: 'getSecretsStoreBindingInfo() equivalent',
      secretsInfo
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get secrets info',
      details: error.message
    });
  }
});

// API endpoint: Validate secrets configuration
app.get('/api/secrets/validate', (req, res) => {
  try {
    const errors = [];
    const bindings = {};
    
    // Get all secrets environment variables
    const secretsVars = Object.keys(process.env)
      .filter(key => key.startsWith('SECRETS_'))
      .reduce((obj, key) => {
        obj[key] = process.env[key];
        return obj;
      }, {});

    // Group by binding name and validate
    const bindingGroups = {};
    Object.keys(secretsVars).forEach(key => {
      const match = key.match(/^SECRETS_([A-Z0-9_]+)_(BINDING|STORE_ID|SECRET_NAME)$/);
      if (match) {
        const bindingName = match[1];
        const varType = match[2];
        
        if (!bindingGroups[bindingName]) {
          bindingGroups[bindingName] = {};
        }
        bindingGroups[bindingName][varType] = secretsVars[key];
      }
    });

    // Validate each binding group
    Object.keys(bindingGroups).forEach(bindingName => {
      const group = bindingGroups[bindingName];
      
      if (!group.BINDING) {
        errors.push(`SECRETS_${bindingName}_BINDING environment variable missing`);
      }
      if (!group.STORE_ID) {
        errors.push(`SECRETS_${bindingName}_STORE_ID environment variable missing`);
      }
      if (!group.SECRET_NAME) {
        errors.push(`SECRETS_${bindingName}_SECRET_NAME environment variable missing`);
      }

      if (group.BINDING) {
        bindings[group.BINDING] = {
          configured: {
            binding: group.BINDING,
            storeId: group.STORE_ID,
            secretName: group.SECRET_NAME
          },
          environment: group,
          valid: !!(group.BINDING && group.STORE_ID && group.SECRET_NAME)
        };
      }
    });

    res.json({
      message: 'Container-generated validation using environment variables',
      containerMethod: 'validateSecretsStoreBindingEnvironment() equivalent',
      validation: {
        valid: errors.length === 0,
        bindings,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to validate secrets configuration',
      details: error.message
    });
  }
});

// API endpoint: Get secrets summary
app.get('/api/secrets/summary', (req, res) => {
  try {
    const bindings = [];
    
    // Parse secrets environment variables
    const secretsVars = Object.keys(process.env)
      .filter(key => key.startsWith('SECRETS_'))
      .reduce((obj, key) => {
        obj[key] = process.env[key];
        return obj;
      }, {});

    // Group by binding name
    const bindingGroups = {};
    Object.keys(secretsVars).forEach(key => {
      const match = key.match(/^SECRETS_([A-Z0-9_]+)_(BINDING|STORE_ID|SECRET_NAME)$/);
      if (match) {
        const bindingName = match[1];
        const varType = match[2];
        
        if (!bindingGroups[bindingName]) {
          bindingGroups[bindingName] = {};
        }
        bindingGroups[bindingName][varType] = secretsVars[key];
      }
    });

    // Create summary
    Object.keys(bindingGroups).forEach(bindingName => {
      const group = bindingGroups[bindingName];
      if (group.BINDING) {
        bindings.push({
          name: group.BINDING,
          storeId: group.STORE_ID || 'unknown',
          secretName: group.SECRET_NAME || 'unknown'
        });
      }
    });

    res.json({
      message: 'Container-generated summary using environment variables',
      containerMethod: 'getSecretsStoreBindingSummary() equivalent',
      summary: {
        configured: bindings.length,
        bindings
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get secrets summary',
      details: error.message
    });
  }
});

// API endpoint: Demonstrate secret access pattern (metadata only for security)
app.get('/api/secrets/get/:secretName', (req, res) => {
  const { secretName } = req.params;
  
  try {
    // In a real application, you would:
    // const secret = await env.API_SECRETS.get(secretName);
    
    // For demo purposes, we simulate the access pattern
    const hasSecretsBinding = Object.keys(process.env).some(key => 
      key.startsWith('SECRETS_') && key.endsWith('_BINDING')
    );

    if (!hasSecretsBinding) {
      return res.status(400).json({
        error: 'No Secrets Store bindings configured',
        secretName
      });
    }

    // Simulate secret retrieval (never return actual secret values in logs/responses)
    res.json({
      message: 'Secret access demonstration (actual secret values not shown for security)',
      secretName,
      exists: true, // In reality: !!secret
      retrieved: true,
      accessPattern: `await env.API_SECRETS.get('${secretName}')`,
      securityNote: 'Actual secret values should never be logged or returned in API responses'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to access secret',
      secretName,
      details: error.message
    });
  }
});

// Root endpoint with container info
app.get('/', (req, res) => {
  const secretsVarCount = Object.keys(process.env).filter(key => 
    key.startsWith('SECRETS_')
  ).length;

  res.json({
    message: 'Secrets Store Container Demo - Container Application',
    container: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      secretsVarsDetected: secretsVarCount
    },
    endpoints: [
      'GET /health - Health check',
      'GET /api/secrets/info - Detailed secrets binding info',
      'GET /api/secrets/validate - Validate secrets configuration',
      'GET /api/secrets/summary - Concise secrets summary',
      'GET /api/secrets/get/:secretName - Demo secret access pattern'
    ],
    note: 'This container demonstrates the same functionality as Container helper methods'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 Secrets Store container app running on port ${PORT}`);
  console.log(`📊 Environment variables detected: ${Object.keys(process.env).length}`);
  console.log(`🔑 Secrets variables detected: ${Object.keys(process.env).filter(k => k.startsWith('SECRETS_')).length}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
