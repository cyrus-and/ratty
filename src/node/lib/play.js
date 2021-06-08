const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..', 'dist');

function serve(response, filePath) {
    const stream = fs.createReadStream(filePath);
    stream.pipe(response);
    stream.on('error', () => {
        response.writeHead(404);
        response.end();
    });
}

function player(sessionPath, options) {
    const server = http.createServer(({url}, response) => {
        // serve session files
        const match = url.match(/^\/session(?<path>\/.*)$/)
        if (match) {
            // skip the /session prefix
            const incomingSessionPath = match.groups.path;

            // serve the session file if arbitrary files are allowed or paths match
            if (options.serveEverything || incomingSessionPath === sessionPath) {
                serve(response, incomingSessionPath);
            } else {
                response.writeHead(403);
                response.end();
            }
        }
        // serve assets
        else {
            // serve index by default
            if (url === '/') {
                url = '/index.html';
            }

            // serve files from the root
            serve(response, path.join(ROOT, path.basename(url)));
        }
    });
    server.listen(options.port, options.host);
    return server;
}

module.exports = player;
