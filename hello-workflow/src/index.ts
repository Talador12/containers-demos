import { DurableObject, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

export class HelloWorkflow extends WorkflowEntrypoint<Env, {}> {
	async run(event: WorkflowEvent<{}>, step: WorkflowStep) {
		return await step.do('run container', async () => {
			const container = this.env.HELLO_CONTAINER.get(this.env.HELLO_CONTAINER.idFromName(event.instanceId));
			
			// Wait for container to be healthy
			let healthy = false;
			for (let i = 0; i < 10; i++) {
				try {
					const healthResponse = await container.fetch(new Request('http://container/health'));
					if (healthResponse.ok) {
						healthy = true;
						break;
					}
				} catch (e) {
					console.log(`Health check attempt ${i + 1} failed:`, e);
				}
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
			
			if (!healthy) {
				throw new Error('Container failed to become healthy');
			}
			
			const response = await container.fetch(new Request('http://container/'));
			return await response.text();
		});
	}
}

export class HelloContainer extends DurableObject<Env> {
	container: Container;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		if (ctx.container === undefined) throw new Error('no container');
		this.container = ctx.container;
		
		ctx.blockConcurrencyWhile(async () => {
			if (!this.container.running) {
				console.log('Starting container...');
				this.container.start({ 
					entrypoint: ['python', 'main.py'], 
					enableInternet: false
				});
				console.log('Container start called');
			}
		});
	}

	async fetch(req: Request): Promise<Response> {
		console.log('Container fetch called for:', new URL(req.url).pathname);
		console.log('Container running status:', this.container.running);
		
		// Try to get the TCP port and make request
		const port = this.container.getTcpPort(8080);
		console.log('Got TCP port:', port);
		
		return await port.fetch('http://container' + new URL(req.url).pathname);
	}
}

export default {
	async fetch(request, env): Promise<Response> {
		if (request.method === 'POST') {
			const workflow = await env.HELLO_WORKFLOW.create({ params: {} });
			return new Response(`Workflow started: ${workflow.id}`);
		}
		return new Response('<button onclick="fetch(\'\', {method:\'POST\'})">Run Workflow</button>', { 
			headers: { 'Content-Type': 'text/html' } 
		});
	},
} satisfies ExportedHandler<Env>;
