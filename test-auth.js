const http = require('http');

function testAuth(password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ password });
    const options = {
      hostname: 'localhost',
      port: 10000,
      path: '/api/Auth/login',
      method: 'POST',
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
    console.log('Testing correct password...');
    const correct = await testAuth('maire2026');
    console.log(`Status: ${correct.status}, Body: ${correct.body}`);

    console.log('\nTesting wrong password...');
    const wrong = await testAuth('wrongpassword');
    console.log(`Status: ${wrong.status}, Body: ${wrong.body}`);
  } catch (error) {
    console.error('Error testing auth:', error);
  }
})();
