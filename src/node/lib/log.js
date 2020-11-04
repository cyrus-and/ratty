const chalk = require('chalk');

function log(marker, message) {
    console.log(`[${marker}] ${message}`);
}

function info(message) {
    log(chalk.green('+'), message);
}

function error(message) {
    log(chalk.red('!'), message);
}

module.exports = {info, error};
