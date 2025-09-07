import { Container } from '@cloudflare/containers';
import { WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';

interface Env {
  KV_CONTAINER: DurableObjectNamespace;
  DEMO_CACHE: KVNamespace;
  USER_SESSIONS: KVNamespace;
}

export class KvContainer extends Container<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env, {
      defaultPort: 8080,
      kvBindings: [
        { binding: 'DEMO_CACHE', namespaceName: 'demo-cache', preview: 'demo-cache-preview' },
        { binding: 'USER_SESSIONS', namespaceName: 'user-sessions', preview: 'user-sessions-preview' }
      ]
    });
  }

  async init() {
    console.log('KV Storage Container initialized');
    console.log('KV Bindings Summary:', this.getKvBindingSummary());
  }
}

export class KvWorkflow extends WorkflowEntrypoint<Env, {}> {
  async run(event: never, step: WorkflowStep) {
    // Start KV container and test KV bindings
    await step.do('start kv container', async () => {
      const container = step.env.KV_CONTAINER.idFromName('kv-demo');
      const kvContainer = step.env.KV_CONTAINER.get(container);

      // Start the container
      await kvContainer.fetch(new Request('http://container/kv-binding-test', {
        method: 'GET'
      }));

      return { message: 'KV Container started and KV bindings tested successfully' };
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response('KV Storage Demo - Use workflows to interact with the container', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
