# Container Checkpointing Demo

This demo showcases the container checkpointing feature that allows you to save and restore container filesystem state.

## Features Demonstrated

- **Simple Checkpointing**: `await container.checkpoint()` - checkpoint entire container
- **Path-Specific Checkpointing**: `await container.checkpoint({ path: '/app' })` - checkpoint specific directories  
- **Checkpoint Restoration**: `await container.restore({ checkpointId })` - restore from checkpoint
- **Checkpoint Management**: List, delete, and cleanup expired checkpoints
- **Automatic Expiration**: 2-week data retention with automatic cleanup

## How It Works

### R2 Bucket Structure
```
container-checkpoints/
├── MyContainer/
│   ├── do-id-123/
│   │   ├── container-snapshot-2023-12-01T10-30-00/
│   │   │   ├── app/
│   │   │   ├── data/
│   │   │   └── logs/
│   │   └── container-snapshot-2023-12-01T11-15-30/
│   └── do-id-456/
└── AnotherContainer/
```

### Container Implementation
The demo container implements the required checkpoint endpoints:
- `POST /__checkpoint` - Creates filesystem snapshots and uploads to R2
- `POST /__restore` - Downloads and restores filesystem data from R2  
- `POST /__delete-checkpoint` - Removes checkpoint data from R2

### Key API Methods
```typescript
// Create checkpoint
const result = await container.checkpoint();
console.log(`Created checkpoint: ${result.checkpointId}`);

// Create checkpoint of specific path  
const appCheckpoint = await container.checkpoint({ path: '/app' });

// List available checkpoints
const checkpoints = await container.listCheckpoints();

// Restore from checkpoint
await container.restore({ 
  checkpointId: 'MyContainer-123-2023-12-01T10-30-00',
  startAfterRestore: true // default
});

// Clean up expired checkpoints (older than 2 weeks)
const deletedCount = await container.cleanupExpiredCheckpoints();
```

## Running the Demo

1. **Deploy the container:**
   ```bash
   npm run deploy
   ```

2. **Test checkpointing workflow:**
   ```bash
   # Create some data
   curl -X POST https://your-demo.your-subdomain.workers.dev/data \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello checkpoint world!"}'

   # Create checkpoint
   curl -X POST https://your-demo.your-subdomain.workers.dev/checkpoint

   # Modify data
   curl -X POST https://your-demo.your-subdomain.workers.dev/data \
     -H "Content-Type: application/json" \  
     -d '{"message": "Modified data"}'

   # Restore checkpoint
   curl -X POST https://your-demo.your-subdomain.workers.dev/restore \
     -H "Content-Type: application/json" \
     -d '{"checkpointId": "your-checkpoint-id"}'

   # Verify original data is restored
   curl https://your-demo.your-subdomain.workers.dev/data
   ```

## Configuration

Add R2 bucket binding to `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "CHECKPOINT_BUCKET"  
bucket_name = "container-checkpoints"
```

## Security & Best Practices

- **Automatic Cleanup**: Checkpoints expire after 2 weeks to manage storage costs
- **Validation**: All checkpoint operations include validation and error handling  
- **Timeout Protection**: Configurable timeouts prevent hanging operations
- **Path Restrictions**: Checkpoint paths are validated to prevent unauthorized access
- **Container State Management**: Proper container stop/start lifecycle during restore

This implementation provides a production-ready checkpointing solution with the simple UX you requested: just call `container.checkpoint()` and everything is handled automatically!
