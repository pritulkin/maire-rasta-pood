const http = require('http');

function testDeleteOrder(orderId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 10000,
      path: `/api/Orders/${orderId}`,
      method: 'DELETE'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (error) => reject(error));
    req.end();
  });
}

(async () => {
  try {
    console.log('Testing DELETE order with ID: debug-test-1');
    const result = await testDeleteOrder('debug-test-1');
    console.log(`Status: ${result.status}`);
    console.log(`Body: ${result.body}`);
  } catch (error) {
    console.error('Error testing DELETE:', error);
  }
})();
