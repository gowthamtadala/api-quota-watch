#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const program = new Command();

program
    .name('api-quota-watch')
    .description('Monitor API rate limits and quotas across multiple providers')
    .version('0.1.0');

program
    .command('add')
    .description('Add an API to monitor')
    .action(require('./commands/add'));

program
    .command('remove <provider>')
    .description('Remove an API from monitoring')
    .action(require('./commands/remove'));

program
    .command('list')
    .description('List all monitored APIs')
    .action(require('./commands/list'));

program
    .command('monitor')
    .description('Check quota status for all APIs')
    .option('-w, --watch', 'Watch mode - continuous monitoring')
    .option('-i, --interval <minutes>', 'Check interval in minutes', '5')
    .action(require('./commands/monitor'));

program
    .command('alert')
    .description('Configure alerts')
    .action(require('./commands/alert'));

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
