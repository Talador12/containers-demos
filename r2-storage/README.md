# R2 Storage Container Demo

This demo shows how to use R2 bucket API bindings with Cloudflare Containers.

## Features

- **R2 Bucket Bindings**: Configure R2 bucket API access in containers
- **Environment Variable Auto-Generation**: Automatic R2 binding config via environment variables  
- **API-Based Access**: Use R2 API bindings instead of filesystem operations
- **Real-Time Logging**: See R2 binding configuration in container logs

## Configuration

### 1. Wrangler Configuration (`wrangler.jsonc`)

```jsonc
{
  "r2_buckets": [
    {
      "binding": "DATA_BUCKET", 
      "bucket_name": "my-demo-data-bucket"
    },
    {
      "binding": "LOGS_BUCKET",
      "bucket_name": "my-demo-logs-bucket" 
    }
  ]
}
```

### 2. Container R2 Binding Setup

```typescript
export class R2StorageContainer extends Container<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    
    // Configure R2 bindings - API-based access
    this.r2Bindings = [
      {
        binding: 'DATA_BUCKET',
        bucketName: 'my-demo-data-bucket'
      },
      {
        binding: 'LOGS_BUCKET',
        bucketName: 'my-demo-logs-bucket'
      }
    ];
  }
}
```

## Environment Variables Generated

The container automatically receives these environment variables for API access:

```bash
R2_DATA_BUCKET_BINDING=DATA_BUCKET
R2_DATA_BUCKET_BUCKET=my-demo-data-bucket

R2_LOGS_BUCKET_BINDING=LOGS_BUCKET
R2_LOGS_BUCKET_BUCKET=my-demo-logs-bucket
```

## Usage

1. **Create R2 buckets** (if they don't exist):
   ```bash
   wrangler r2 bucket create my-demo-data-bucket
   wrangler r2 bucket create my-demo-logs-bucket
   ```

2. **Start development**:
   ```bash
   wrangler dev
   ```

3. **Test endpoints**:
   - `/` - Demo homepage with links
   - `/start-container` - Initialize container with R2 bindings
   - `/test-r2-env` - Show R2 environment variables 
   - `/test-r2-bindings` - Test R2 binding configuration

## Expected Log Output

When the container starts, you'll see:

```
=== R2 STORAGE CONTAINER STARTUP ===
R2 Environment Variables:
  R2_DATA_BUCKET_BINDING=DATA_BUCKET
  R2_DATA_BUCKET_BUCKET=my-demo-data-bucket
  R2_LOGS_BUCKET_BINDING=LOGS_BUCKET
  R2_LOGS_BUCKET_BUCKET=my-demo-logs-bucket
  Found 4 R2 environment variables
R2 Bindings configured:
  DATA_BUCKET -> my-demo-data-bucket
  LOGS_BUCKET -> my-demo-logs-bucket
=====================================
```

## R2 API Binding Testing

The `/test-r2-bindings` endpoint demonstrates:
- ✅ **R2 binding environment variables** properly configured
- 📋 **Binding validation** for each configured R2 bucket
- 🔗 **API-based access** instead of filesystem operations
- 📝 **Environment variable parsing** and validation

This proves the R2 API binding system works as expected!
