const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..', 'dist');

function replay(options) {
    const http = require('http');
    const server = http.createServer(({url}, response) => {
        // serve index by default
        if (url === '/') {
            url = '/index.html';
        }

        // serve the static file
        const stream = fs.createReadStream(path.join(ROOT, path.basename(url)));
        stream.pipe(response);
        stream.on('error', () => {
            response.writeHead(500);
            response.end();
        });
    });
    server.listen(options.port, options.host);
    return server;
}

module.exports = replay;
