const chalk = require('chalk');
const inquirer = require('inquirer');
const storage = require('../utils/storage');

async function remove(provider) {
    const api = storage.getAPI(provider);

    if (!api) {
        console.log(chalk.red(`\n❌ Provider '${provider}' not found.\n`));
        return;
    }

    const confirm = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirmed',
            message: `Remove ${provider}?`,
            default: false
        }
    ]);

    if (confirm.confirmed) {
        storage.removeAPI(provider);
        console.log(chalk.green(`\n✅ ${provider} removed.\n`));
    } else {
        console.log(chalk.gray('\nCancelled.\n'));
    }
}

module.exports = remove;
