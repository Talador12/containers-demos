# Secrets Store Container Example

This example demonstrates how to use Cloudflare Secrets Store with the Container class from `@cloudflare/containers`. It shows how to securely manage and access secrets within containerized applications.

## What This Example Shows

- **Secrets Store Integration**: Configure and use Cloudflare Secrets Store bindings with minimal code
- **Container Helper Methods**: Leverage built-in methods for environment variable management and validation
- **Secret Management**: Securely store, retrieve, and manage sensitive data like API keys and credentials
- **Simple API**: Clean endpoints for secret operations with automatic environment setup

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create secrets in Cloudflare Secrets Store:**
   ```bash
   # Create a secret store (if you don't have one)
   wrangler secrets-store create my-app-secrets

   # Add secrets to the store
   wrangler secrets-store secret put my-app-secrets api-key "your-secret-api-key"
   wrangler secrets-store secret put my-app-secrets db-password "your-database-password"
   ```

3. **Configure your secrets store binding in `wrangler.jsonc`:**
   ```jsonc
   {
     "secrets_store": [
       {
         "binding": "API_SECRETS",
         "store_id": "my-app-secrets"
       }
     ]
   }
   ```

4. **Deploy and test:**
   ```bash
   npm run deploy
   curl https://your-worker.your-subdomain.workers.dev/api/secrets/info
   ```

## Container Implementation

The example shows how the Container class simplifies Secrets Store management:

**Before (manual approach):**
```typescript
// 40+ lines of manual environment parsing and validation
const secretsEnv = {};
for (const [key, value] of Object.entries(env)) {
  if (key.startsWith('SECRETS_')) {
    // Complex parsing logic...
  }
}
// Manual validation, error handling, etc.
```

**After (with Container class):**
```typescript
// 3 clean API calls
const secretsInfo = container.getSecretsStoreBindingInfo();
const validation = container.validateSecretsStoreBindingEnvironment();
const summary = container.getSecretsStoreBindingSummary();
```

## API Endpoints

### GET `/api/secrets/info`
Returns detailed information about configured Secrets Store bindings:
```json
{
  "API_SECRETS": {
    "binding": "API_SECRETS",
    "storeId": "my-app-secrets",
    "secretName": "api-secrets",
    "envVars": {
      "SECRETS_API_SECRETS_BINDING": "API_SECRETS",
      "SECRETS_API_SECRETS_STORE_ID": "my-app-secrets",
      "SECRETS_API_SECRETS_SECRET_NAME": "api_secrets"
    }
  }
}
```

### GET `/api/secrets/validate`
Validates that all Secrets Store environment variables are properly configured:
```json
{
  "valid": true,
  "bindings": {
    "API_SECRETS": {
      "configured": {...},
      "environment": {...},
      "valid": true
    }
  },
  "errors": []
}
```

### GET `/api/secrets/summary`
Provides a concise summary of Secrets Store configuration:
```json
{
  "configured": 1,
  "bindings": [
    {
      "name": "API_SECRETS",
      "storeId": "my-app-secrets",
      "secretName": "api-secrets"
    }
  ]
}
```

### GET `/api/secrets/get/:secretName`
Retrieves a specific secret value (demonstrates actual secret access):
```json
{
  "secretName": "api-key",
  "exists": true,
  "retrieved": true
}
```

## Configuration

### Secrets Store Bindings

The Container class automatically handles Secrets Store bindings configured in the constructor:

```typescript
const container = new Container(ctx, env, {
  secretsStoreBindings: [
    {
      binding: 'API_SECRETS',
      storeId: 'my-app-secrets',
      secretName: 'api-secrets'
    }
  ]
});
```

### Auto-Detection

The Container class can also auto-detect Secrets Store bindings from the environment:

```typescript
// No explicit configuration needed - auto-detected!
const container = new Container(ctx, env);
```

### Environment Variables

The Container class automatically generates and manages these environment variables:

- `SECRETS_{BINDING_NAME}_BINDING`: The binding name
- `SECRETS_{BINDING_NAME}_STORE_ID`: The secrets store ID  
- `SECRETS_{BINDING_NAME}_SECRET_NAME`: The secret name

## Security Best Practices

- **Never log secret values**: This demo shows metadata only, never actual secret content
- **Use appropriate permissions**: Ensure your Worker has proper access to the secrets store
- **Validate configuration**: Always validate bindings before accessing secrets
- **Handle errors gracefully**: Implement proper error handling for missing or inaccessible secrets

## Development

- **Start development server**: `npm run dev`
- **Deploy to production**: `npm run deploy`
- **Run tests**: `npm test`

## Container Benefits

Using the Container class provides:

1. **Simplified Configuration**: Auto-detection and validation of Secrets Store bindings
2. **Environment Management**: Automatic generation of required environment variables
3. **Developer Experience**: Clean APIs for common operations
4. **Error Handling**: Built-in validation with detailed error messages
5. **Consistency**: Same patterns as KV and R2 integrations

## Learn More

- [Cloudflare Secrets Store Documentation](https://developers.cloudflare.com/secrets-store/)
- [Secrets Store Workers Integration](https://developers.cloudflare.com/secrets-store/integrations/workers/)
- [Container Class Documentation](https://github.com/cloudflare/containers)
