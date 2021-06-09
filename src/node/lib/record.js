const fs = require('fs');
const pty = require('node-pty');
const tty = require('../../../build/Release/tty.node');
const zlib = require('zlib');

function record(argv, options, callback) {
    function emitEvent(event) {
        // writes one JSON object (event) per line
        session.write(JSON.stringify(event) + '\n');
    }

    function flush() {
        // nothing to do if buffers are empty (this may happen when the process just exits)
        if (!input && !output) {
            return;
        }

        // compute the delay relative to the epoch
        const delay = timestamp - epoch;

        // save the JSON representation of the record (one per line)
        emitEvent(['frame', delay, input, output]);

        // continue with empty buffers
        input = output = '';
    }

    function resize() {
        const {columns, rows} = process.stdout;

        // flush the frame so to display the next output in the resized terminal
        flush();

        // resize the terminal
        ptyProcess.resize(columns, rows);

        // emit the resize event
        emitEvent(['resize', columns, rows]);
    }

    // reset state
    let epoch;
    let timestamp;
    let input = '';
    let output = '';

    // open the file for writing
    const fd = fs.openSync(options.output, 'w', 0o600);

    // create a compressed stream to write the data to
    const session = zlib.createGzip();

    // pipe it to the output file
    session.pipe(fs.createWriteStream(null, {fd}));

    // write the header
    emitEvent(['start', new Date().toISOString(), argv]);

    // run the command
    const rattyLevel = (parseInt(process.env['RATTY_LEVEL'], 10) || 0) + 1;
    const ptyProcess = pty.spawn(argv[0], argv.slice(1), {
        env: {
            ...process.env,
            RATTY_LEVEL: rattyLevel // similar to SHLVL
        }
    });

    // handle the terminal resize and syntetically trigger the first time
    process.stdout.on('resize', resize);
    resize();

    // set the terminal raw mode
    tty.enterRawMode();

    // process data coming from stdin
    process.stdin.on('data', (chunk) => {
        if (options.stdin) {
            // store the chunk in the buffer if requested
            input += chunk;
        }

        // hand the chunk to the PTY process
        ptyProcess.write(chunk);
    });

    // process data coming from the PTY
    ptyProcess.on('data', (chunk) => {
        // read the next chunk and mark the timestamp in milliseconds
        const now = Number(process.hrtime.bigint() / 1000000n);

        // the first chunk marks the epoch
        if (epoch === undefined) {
            epoch = timestamp = now;
        }

        // if the time passed since the last flush is enough
        const delta = now - timestamp;
        if (delta > options.interval) {
            // flush again then update the timestamp for the current frame
            flush();
            timestamp = now;
        }

        // store the chunk in the buffer and hand it to stdout
        output += chunk;
        process.stdout.write(chunk);
    });

    // handle the termination of the process
    ptyProcess.on('exit', (status, signal) => {
        // write the pending data in the buffers and finalize
        flush();

        // write the footer
        emitEvent(['finish', new Date().toISOString()]);

        // finish the session
        session.end();

        // destroy stdin so to allow the process to exit
        process.stdin.destroy();

        // reset the terminal TTY mode
        tty.leaveRawMode();

        // notify the caller
        callback(status, signal);
    });
}

module.exports = record;
