# Container Checkpointing API Reference

## Core Methods

### `checkpoint(options?: CheckpointOptions): Promise<CheckpointResult>`

Creates a checkpoint of the container's filesystem.

**Parameters:**
- `options.path?: string` - Specific path to checkpoint (defaults to entire container)
- `options.name?: string` - Custom checkpoint name (auto-generated if not provided)
- `options.timeoutSeconds?: number` - Operation timeout (default: 300 seconds)

**Returns:**
```typescript
{
  checkpointId: string;      // Auto-generated ID: ContainerName-id-timestamp
  r2Path: string;           // R2 storage path
  createdAt: Date;          // Checkpoint creation time
  sizeBytes: number;        // Archive size in bytes
  checkpointedPath: string; // Path that was checkpointed
}
```

**Example:**
```typescript
// Checkpoint entire container
const result = await container.checkpoint();

// Checkpoint specific directory
const appResult = await container.checkpoint({ path: '/app' });

// Checkpoint with custom timeout
const timeoutResult = await container.checkpoint({ 
  path: '/data',
  timeoutSeconds: 600 
});
```

### `restore(options: RestoreOptions): Promise<RestoreResult>`

Restores container from a checkpoint.

**Parameters:**
- `options.checkpointId: string` - Checkpoint ID to restore from
- `options.timeoutSeconds?: number` - Operation timeout (default: 300 seconds)
- `options.startAfterRestore?: boolean` - Whether to start container after restore (default: true)

**Returns:**
```typescript
{
  checkpointId: string;       // Restored checkpoint ID
  restoredPath: string;       // Path where data was restored
  restoredAt: Date;          // Restore completion time
  restoredSizeBytes: number; // Size of restored data
}
```

**Example:**
```typescript
// Basic restore
const result = await container.restore({ 
  checkpointId: 'MyContainer-123-2023-12-01T10-30-00' 
});

// Restore without auto-starting
const noStartResult = await container.restore({
  checkpointId: 'MyContainer-123-2023-12-01T10-30-00',
  startAfterRestore: false
});
```

### `listCheckpoints(): Promise<CheckpointInfo[]>`

Lists all available checkpoints for this container.

**Returns:**
```typescript
{
  checkpointId: string;    // Checkpoint identifier
  r2Path: string;         // R2 storage path
  createdAt: Date;        // Creation timestamp
  expiresAt: Date;        // Expiration timestamp (2 weeks)
  sizeBytes: number;      // Archive size
  originalPath: string;   // Original checkpointed path
}[]
```

**Example:**
```typescript
const checkpoints = await container.listCheckpoints();
console.log(`Found ${checkpoints.length} checkpoints`);

checkpoints.forEach(cp => {
  console.log(`${cp.checkpointId}: ${cp.sizeBytes} bytes, expires ${cp.expiresAt}`);
});
```

### `deleteCheckpoint(checkpointId: string): Promise<boolean>`

Deletes a specific checkpoint.

**Parameters:**
- `checkpointId: string` - ID of checkpoint to delete

**Returns:**
- `boolean` - true if deleted, false if not found

**Example:**
```typescript
const deleted = await container.deleteCheckpoint('MyContainer-123-2023-12-01T10-30-00');
if (deleted) {
  console.log('Checkpoint deleted successfully');
} else {
  console.log('Checkpoint not found');
}
```

### `cleanupExpiredCheckpoints(): Promise<number>`

Removes all expired checkpoints (older than 2 weeks).

**Returns:**
- `number` - Count of deleted checkpoints

**Example:**
```typescript
const deletedCount = await container.cleanupExpiredCheckpoints();
console.log(`Cleaned up ${deletedCount} expired checkpoints`);
```

## Container Endpoints

Your container application should implement these endpoints to support checkpointing:

### `POST /__checkpoint`

**Request Body:**
```json
{
  "sourcePath": "/app",
  "r2Path": "container-checkpoints/MyContainer/123/snapshot-2023-12-01T10-30-00",
  "timeoutSeconds": 300
}
```

**Response:**
```json
{
  "sizeBytes": 1024000
}
```

### `POST /__restore`

**Request Body:**
```json
{
  "r2Path": "container-checkpoints/MyContainer/123/snapshot-2023-12-01T10-30-00",
  "targetPath": "/app",
  "timeoutSeconds": 300
}
```

**Response:**
```json
{
  "sizeBytes": 1024000
}
```

### `POST /__delete-checkpoint`

**Request Body:**
```json
{
  "r2Path": "container-checkpoints/MyContainer/123/snapshot-2023-12-01T10-30-00"
}
```

## Error Handling

All methods throw errors for various failure conditions:

- **Container not running**: `"Container must be running to create a checkpoint"`
- **Checkpoint not found**: `"Checkpoint {id} not found"`  
- **Checkpoint expired**: `"Checkpoint {id} has expired"`
- **Timeout**: `"Checkpoint operation timed out after {n} seconds"`
- **Network errors**: Various R2 and container communication errors

**Example Error Handling:**
```typescript
try {
  const result = await container.checkpoint();
  console.log('Checkpoint created:', result.checkpointId);
} catch (error) {
  if (error.message.includes('not running')) {
    console.log('Container needs to be started first');
  } else if (error.message.includes('timed out')) {
    console.log('Operation took too long, try again');
  } else {
    console.error('Checkpoint failed:', error.message);
  }
}
```

## R2 Bucket Structure

Checkpoints are stored in R2 with this hierarchy:

```
container-checkpoints/
├── {ContainerClassName}/
│   ├── {DurableObjectId}/
│   │   ├── container-snapshot-{timestamp}/
│   │   │   └── (archived files)
│   │   └── container-snapshot-{timestamp}/
│   └── {AnotherDurableObjectId}/
└── {AnotherContainerClass}/
```

- **Automatic naming**: No manual naming required
- **Collision-free**: DO ID ensures uniqueness
- **Time-sorted**: Timestamp enables chronological ordering
- **Auto-expiry**: 2-week retention with automatic cleanup
