import { Container } from '@cloudflare/containers';

interface Env {
	DATA_BUCKET: R2Bucket;
	LOGS_BUCKET: R2Bucket;
	R2_STORAGE_CONTAINER: DurableObjectNamespace;
}

export class R2StorageContainer extends Container<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		
		// Configure R2 bucket bindings for API access
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
		
		// Set default port for the container
		this.defaultPort = 8080;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		
		// Handle different endpoints
		switch (url.pathname) {
			case '/start-container':
				await this.startAndWaitForPorts();
				return new Response('Container started! Check logs for R2 mount environment variables.');
				
			case '/test-r2-env':
				// Test R2 access through environment variables
				const response = await this.containerFetch('/r2-env-test');
				return response;
				
			case '/test-r2-bindings':
				const bindingResponse = await this.containerFetch('/r2-binding-test');
				return bindingResponse;
				
			case '/test-r2-files':
				// Test file operations in mounted directories
				const fileResponse = await this.containerFetch('/file-test');
				return fileResponse;
				
			case '/':
				return new Response(`
<!DOCTYPE html>
<html>
<head>
	<title>R2 Storage Container Demo</title>
</head>
<body>
	<h1>R2 Storage Container Demo</h1>
	<p>This demo shows R2 bucket directory mounting with containers.</p>
	
	<h2>Test Options:</h2>
	<ul>
		<li><a href="/start-container">Start Container</a> - Initialize container with R2 mounts</li>
		<li><a href="/test-r2-env">Test R2 Environment Variables</a> - Show R2 config in container</li>
		<li><a href="/test-r2-files">Test R2 File Operations</a> - Test mounted directory access</li>
	</ul>
	
	<h2>Expected Environment Variables:</h2>
	<pre>
R2_MY_DEMO_DATA_BUCKET_BUCKET=my-demo-data-bucket
R2_MY_DEMO_DATA_BUCKET_MOUNT_PATH=/mnt/data
R2_MY_DEMO_DATA_BUCKET_READ_ONLY=false

R2_MY_DEMO_LOGS_BUCKET_BUCKET=my-demo-logs-bucket
R2_MY_DEMO_LOGS_BUCKET_MOUNT_PATH=/mnt/logs
R2_MY_DEMO_LOGS_BUCKET_READ_ONLY=true
	</pre>
</body>
</html>`, { 
					headers: { 'Content-Type': 'text/html' } 
				});
				
			default:
				return new Response('Not Found', { status: 404 });
		}
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const id = env.R2_STORAGE_CONTAINER.idFromName('demo');
		const container = env.R2_STORAGE_CONTAINER.get(id);
		return container.fetch(request);
	}
} satisfies ExportedHandler<Env>;
