const chalk = require('chalk');
const inquirer = require('inquirer');
const storage = require('../utils/storage');

async function alert() {
    const apis = storage.getAPIs();

    if (Object.keys(apis).length === 0) {
        console.log(chalk.yellow('\n⚠️  No APIs configured.\n'));
        return;
    }

    console.log(chalk.cyan('\n🔔 Configure Alerts\n'));

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Select provider:',
            choices: Object.keys(apis)
        },
        {
            type: 'number',
            name: 'threshold',
            message: 'Alert threshold (percentage):',
            default: 80,
            validate: input => (input >= 0 && input <= 100) || 'Must be between 0-100'
        },
        {
            type: 'input',
            name: 'webhook',
            message: 'Slack webhook URL (optional):',
            default: ''
        }
    ]);

    storage.setAlert(answers.provider, answers.threshold, answers.webhook);

    console.log(chalk.green(`\n✅ Alert configured for ${answers.provider}`));
    console.log(chalk.gray(`   Threshold: ${answers.threshold}%`));
    if (answers.webhook) {
        console.log(chalk.gray(`   Webhook: ${answers.webhook.substring(0, 30)}...`));
    }
    console.log('');
}

module.exports = alert;
