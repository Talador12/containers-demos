import { Container } from '@cloudflare/containers';

export interface Env {
  API_SECRETS: any; // Secrets Store binding
  SECRETS_STORE_CONTAINER: DurableObjectNamespace;
}

export class SecretsStoreContainer extends Container<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env, {
      secretsStoreBindings: [
        {
          binding: 'API_SECRETS',
          storeId: 'my-app-secrets',
          secretName: 'api-secrets'
        }
      ]
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Route to different handlers based on path
    if (url.pathname.startsWith('/api/secrets')) {
      // Create a Durable Object instance for secrets management
      const doId = env.SECRETS_STORE_CONTAINER.idFromName('secrets-store-demo');
      const doInstance = env.SECRETS_STORE_CONTAINER.get(doId);
      return await doInstance.fetch(request);
    }

    // Default response with links to available endpoints
    return new Response(`
      <html>
        <head>
          <title>Secrets Store Container Demo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .endpoint { margin: 20px 0; padding: 10px; border-left: 4px solid #f6821f; }
            code { background: #f4f4f4; padding: 2px 4px; }
          </style>
        </head>
        <body>
          <h1>🔐 Secrets Store Container Demo</h1>
          <p>This demo showcases Cloudflare Secrets Store integration using the Container class from <code>@cloudflare/containers</code>.</p>
          
          <h2>Available Endpoints:</h2>
          
          <div class="endpoint">
            <h3>GET /api/secrets/info</h3>
            <p>Get detailed information about configured Secrets Store bindings</p>
            <a href="/api/secrets/info">Try it →</a>
          </div>
          
          <div class="endpoint">
            <h3>GET /api/secrets/validate</h3>
            <p>Validate Secrets Store environment variables configuration</p>
            <a href="/api/secrets/validate">Try it →</a>
          </div>
          
          <div class="endpoint">
            <h3>GET /api/secrets/summary</h3>
            <p>Get a concise summary of Secrets Store configuration</p>
            <a href="/api/secrets/summary">Try it →</a>
          </div>
          
          <div class="endpoint">
            <h3>GET /api/secrets/get/:secretName</h3>
            <p>Retrieve a specific secret (demonstrates access pattern)</p>
            <a href="/api/secrets/get/api-key">Try with api-key →</a>
          </div>
          
          <h2>Container Benefits:</h2>
          <ul>
            <li><strong>Simplified Configuration:</strong> Auto-detection and validation</li>
            <li><strong>Environment Management:</strong> Automatic variable generation</li>
            <li><strong>Clean APIs:</strong> 3 helper methods vs 40+ lines of manual code</li>
            <li><strong>Consistent Patterns:</strong> Same UX as KV and R2 integrations</li>
          </ul>
          
          <p><a href="https://github.com/cloudflare/containers">Learn more about the Container class →</a></p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};
