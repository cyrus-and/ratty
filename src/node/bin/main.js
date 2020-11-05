#!/usr/bin/env node

const log = require('../lib/log');
const package = require('../../../package.json');
const program = require('commander');

program
    .version(package.version, '-v, --version', 'Print the version number')
    .description(package.description)
    .helpOption('-h, --help', 'Print the command line options')
    .addHelpCommand(false);

program
    .command('record [<argv>...]')
    .description('Record a terminal session to file.')
    .option('-o, --output <file>', 'Session file', `session-${new Date().toISOString()}.${package.name}`)
    .option('-t, --interval <ms>', 'Minimum interval between frames', 100)
    .action((argv, options) => {
        const record = require('../lib/record');

        // use the current shell as the default command
        if (argv.length === 0) {
            argv = [process.env.SHELL || '/bin/sh'];
        }

        try {
            // clean the screen before starting
            process.stdout.write('\x1bc');
            log.info(`Saving session to '${options.output}'`);

            // run the program and start recording
            record(argv, options, (status, signal) => {
                let message = `Program exited with status ${status}`;
                if (signal) {
                    message += ` (killed by signal ${signal})`;
                }
                log.info(message);
                log.info(`Session saved to '${options.output}'`);
            });
        } catch (err) {
            log.error(err.message);
        }
    });

program
    .command('player')
    .description('Start the web player.')
    .option('--host <host>', 'Start the server on <host>', 'localhost')
    .option('--port <port>', 'Start the server on <port> instead of random', 0)
    .option('-O, --no-open', 'Do not open the URL automatically')
    .action((options) => {
        const open = require('open');
        const player = require('../lib/player');

        // serve the player
        const server = player(options).on('listening', () => {
            // compute the listening URL
            const url = `http://${options.host}:${server.address().port}`;

            log.info(`Listening on ${url}`);

            // open the browser automatically
            if (options.open) {
                open(url);
            }
        }).on('error', (err) => {
            log.error(err.message);
        });

        // allow a clean exit status on Ctrl-C
        process.once('SIGINT', () => {
            process.exit();
        });
    });

program.parse(process.argv);
