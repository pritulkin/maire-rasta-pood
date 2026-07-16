const http = require('http');

function testStaticFile(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 10000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, bodyLength: body.length });
      });
    });

    req.on('error', (error) => reject(error));
    req.end();
  });
}

(async () => {
  try {
    console.log('Testing static files...');
    
    const index = await testStaticFile('/index.html');
    console.log(`index.html: Status ${index.status}, Length ${index.bodyLength}`);
    
    const appJs = await testStaticFile('/app.js?v=2');
    console.log(`app.js?v=2: Status ${appJs.status}, Length ${appJs.bodyLength}`);
    
    const adminHtml = await testStaticFile('/admin.html');
    console.log(`admin.html: Status ${adminHtml.status}, Length ${adminHtml.bodyLength}`);
    
    const styles = await testStaticFile('/styles.css');
    console.log(`styles.css: Status ${styles.status}, Length ${styles.bodyLength}`);
    
    const img = await testStaticFile('/img/image1.jpg');
    console.log(`img/image1.jpg: Status ${img.status}, Length ${img.bodyLength}`);
    
  } catch (error) {
    console.error('Error testing static files:', error);
  }
})();
