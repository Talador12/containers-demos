# Hello Container Workflow

Minimal demo: Python FastAPI container running in a Cloudflare Workflow.

## What it does
- Container returns "Hello Containers on Workflows!" 
- Workflow calls container in one step
- FastAPI provides Swagger docs at `/docs`

## Usage
```bash
pnpm dev
# Click "Run Workflow" button
```

## Files
- `container/main.py` - FastAPI server (2 endpoints: `/`, `/health`)
- `src/index.ts` - Workflow + Container class  
- `Dockerfile` - Python container image
- `wrangler.jsonc` - Configuration
