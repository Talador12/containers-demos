const express = require('express');

const app = express();
const port = 8080;

// Log all R2 environment variables on startup
console.log('=== R2 Binding Environment Variables ===');
const r2EnvVars = Object.keys(process.env).filter(key => key.startsWith('R2_'));
r2EnvVars.forEach(key => {
  console.log(`${key}=${process.env[key]}`);
});

if (r2EnvVars.length === 0) {
	console.log('  No R2 environment variables found');
} else {
	console.log(`  Found ${r2EnvVars.length} R2 environment variables`);
}

console.log('=======================================');
console.log(`  /mnt/data exists: ${require('fs').existsSync('/mnt/data')}`);
console.log(`  /mnt/logs exists: ${require('fs').existsSync('/mnt/logs')}`);
console.log('=====================================');

app.get('/r2-env-test', (req, res) => {
	console.log('\n=== R2 Environment Test ===');
	
	const r2Config = {};
	Object.keys(process.env).forEach(key => {
		if (key.startsWith('R2_')) {
			r2Config[key] = process.env[key];
			console.log(`${key}=${process.env[key]}`);
		}
	});
	
	const response = {
		message: 'R2 Environment Variables',
		r2Config,
		mountPaths: {
			'/mnt/data': require('fs').existsSync('/mnt/data'),
			'/mnt/logs': require('fs').existsSync('/mnt/logs')
		},
		timestamp: new Date().toISOString()
	};
	
	console.log('Response:', JSON.stringify(response, null, 2));
	console.log('===========================\n');
	
	res.json(response);
});

app.get('/file-test', async (req, res) => {
	console.log('\n=== R2 File Operations Test ===');
	
	const results = {};
	
	try {
		// Test data directory (read/write)
		const dataDir = '/mnt/data';
		const testFile = path.join(dataDir, 'test-file.txt');
		const testContent = `Hello R2! Written at ${new Date().toISOString()}`;
		
		console.log(`Testing write to ${testFile}`);
		
		try {
			await fs.writeFile(testFile, testContent);
			console.log('✓ Write successful');
			
			const readContent = await fs.readFile(testFile, 'utf8');
			console.log(`✓ Read successful: ${readContent}`);
			
			results.dataDirectory = {
				path: dataDir,
				writable: true,
				testFile: testFile,
				content: readContent
			};
		} catch (writeError) {
			console.log(`✗ Write failed: ${writeError.message}`);
			results.dataDirectory = {
				path: dataDir,
				writable: false,
				error: writeError.message
			};
		}
		
		// Test logs directory (read-only)
		const logsDir = '/mnt/logs';
		const logFile = path.join(logsDir, 'test-log.txt');
		
		console.log(`Testing write to ${logFile} (should fail - read-only)`);
		
		try {
			await fs.writeFile(logFile, 'This should fail');
			console.log('✗ Unexpected: Write succeeded to read-only directory');
			results.logsDirectory = {
				path: logsDir,
				readOnly: false,
				error: 'Expected read-only but write succeeded'
			};
		} catch (readOnlyError) {
			console.log(`✓ Expected: Write failed to read-only directory: ${readOnlyError.message}`);
			results.logsDirectory = {
				path: logsDir,
				readOnly: true,
				message: 'Correctly prevented write to read-only mount'
			};
		}
		
		// List directory contents
		try {
			const dataContents = await fs.readdir(dataDir);
			console.log(`Data directory contents: ${dataContents.join(', ')}`);
			results.dataDirectory.contents = dataContents;
		} catch (e) {
			console.log(`Could not list data directory: ${e.message}`);
		}
		
		try {
			const logsContents = await fs.readdir(logsDir);
			console.log(`Logs directory contents: ${logsContents.join(', ')}`);
			results.logsDirectory.contents = logsContents;
		} catch (e) {
			console.log(`Could not list logs directory: ${e.message}`);
		}
		
	} catch (error) {
		console.log(`File test error: ${error.message}`);
		results.error = error.message;
	}
	
	console.log('File test results:', JSON.stringify(results, null, 2));
	console.log('===============================\n');
	
	res.json({
		message: 'R2 File Operations Test Results',
		results,
		timestamp: new Date().toISOString()
	});
});

app.get('/r2-binding-test', (req, res) => {
	console.log('\n=== R2 Binding Test ===');
	
	// Use Container class helper methods for clean UX
	const bindingInfo = global.container.getR2BindingInfo();
	const validation = global.container.validateR2BindingEnvironment();
	const summary = global.container.getR2BindingSummary();
	
	console.log('R2 Binding Summary:');
	console.log(`  Total bindings configured: ${summary.configured}`);
	summary.bindings.forEach(binding => {
		console.log(`  ${binding.name} -> ${binding.bucket}`);
	});
	
	console.log('\nR2 Binding Validation:');
	if (validation.valid) {
		console.log('  ✓ All R2 bindings are properly configured');
	} else {
		console.log('  ✗ R2 binding configuration errors:');
		validation.errors.forEach(error => {
			console.log(`    - ${error}`);
		});
	}
	
	console.log('\nDetailed Binding Information:');
	Object.keys(bindingInfo).forEach(bindingName => {
		const info = bindingInfo[bindingName];
		console.log(`  ${bindingName}:`);
		console.log(`    Bucket: ${info.bucketName}`);
		console.log(`    Environment Variables:`);
		Object.keys(info.envVars).forEach(envVar => {
			console.log(`      ${envVar}=${info.envVars[envVar]}`);
		});
	});
	
	const results = {
		summary,
		validation,
		bindingInfo
	};
	
	console.log('======================\n');
	
	res.json({
		message: 'R2 Binding Test Results',
		results,
		timestamp: new Date().toISOString()
	});
});

app.get('/health', (req, res) => {
	res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
	console.log(`\n🚀 R2 Storage Container listening on port ${PORT}`);
	console.log('Available endpoints:');
	console.log('  /r2-env-test  - Show R2 environment variables');
	console.log('  /file-test    - Test R2 mounted directory operations');
	console.log('  /health       - Health check');
});
