const chalk    = require('chalk');
const inquirer = require('inquirer');
const storage  = require('../utils/storage');

async function alert() {
    const apis = storage.getAPIs();

    if (Object.keys(apis).length === 0) {
        console.log(chalk.yellow('\n⚠️  No APIs configured.\n'));
        return;
    }

    console.log(chalk.cyan('\n🔔 Configure Alerts\n'));

    const existingAlerts = storage.getAlerts();

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Select provider:',
            choices: Object.keys(apis).map(k => {
                const existing = existingAlerts[k];
                const suffix   = existing ? chalk.gray(` (currently ${existing.threshold}%)`) : '';
                return { name: `${k}${suffix}`, value: k };
            })
        },
        {
            type: 'number',
            name: 'threshold',
            message: 'Alert threshold (%):',
            default: (answers) => existingAlerts[answers?.provider]?.threshold || 80,
            validate: input => (input >= 0 && input <= 100) || 'Must be 0–100'
        },
        {
            type: 'list',
            name: 'platform',
            message: 'Notification channel:',
            choices: [
                { name: 'None (threshold-only, no notifications)', value: 'none' },
                { name: 'Slack  (Incoming Webhook URL)',            value: 'slack' },
                { name: 'Discord (Webhook URL)',                    value: 'discord' },
                { name: 'Generic JSON POST',                        value: 'generic' }
            ]
        },
        {
            type: 'input',
            name: 'webhook',
            message: 'Webhook URL:',
            when: answers => answers.platform !== 'none',
            validate: input => {
                try { new URL(input); return true; } catch { return 'Enter a valid URL'; }
            }
        }
    ]);

    const webhook = answers.platform === 'none' ? '' : answers.webhook;
    storage.setAlert(answers.provider, answers.threshold, webhook);

    console.log(chalk.green(`\n✅ Alert configured for ${answers.provider}`));
    console.log(chalk.gray(`   Threshold : ${answers.threshold}%`));

    if (webhook) {
        console.log(chalk.gray(`   Platform  : ${answers.platform}`));
        console.log(chalk.gray(`   Webhook   : ${webhook.substring(0, 45)}...`));

        // Offer a test send
        const { testNow } = await inquirer.prompt([{
            type: 'confirm',
            name: 'testNow',
            message: 'Send a test alert now?',
            default: false
        }]);

        if (testNow) {
            const { sendThresholdAlert } = require('../utils/webhook');
            const ora = require('ora');
            const spinner = ora('Sending test alert...').start();
            try {
                await sendThresholdAlert(webhook, answers.provider, answers.threshold, answers.threshold);
                spinner.succeed('Test alert sent! Check your channel.');
            } catch (err) {
                spinner.fail(`Failed: ${err.message}`);
                console.log(chalk.yellow('   Double-check your webhook URL and try again.'));
            }
        }
    }

    console.log('');
}

module.exports = alert;
