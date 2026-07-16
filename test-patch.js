const http = require('http');

function testPatchMethod() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ status: 'processed' });
    const options = {
      hostname: 'localhost',
      port: 10000,
      path: '/api/Orders/debug-test-1',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (error) => reject(error));
    req.write(postData);
    req.end();
  });
}

(async () => {
  try {
    console.log('Testing PATCH method...');
    const result = await testPatchMethod();
    console.log(`Status: ${result.status}`);
    console.log(`Body: ${result.body}`);
  } catch (error) {
    console.error('Error testing PATCH:', error);
  }
})();
