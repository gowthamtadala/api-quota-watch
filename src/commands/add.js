const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const storage = require('../utils/storage');
const OpenAIProvider = require('../providers/openai');
const StripeProvider = require('../providers/stripe');
const GitHubProvider = require('../providers/github');

const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        keyFormat: 'sk-...',
        class: OpenAIProvider
    },
    stripe: {
        name: 'Stripe',
        keyFormat: 'sk_live_... or sk_test_...',
        class: StripeProvider
    },
    github: {
        name: 'GitHub',
        keyFormat: 'ghp_...',
        class: GitHubProvider
    }
};

async function add() {
    console.log(chalk.bold.cyan('\n🔐 Add API to Monitor\n'));

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Select API provider:',
            choices: Object.keys(PROVIDERS).map(key => ({
                name: `${PROVIDERS[key].name} (${PROVIDERS[key].keyFormat})`,
                value: key
            }))
        },
        {
            type: 'password',
            name: 'apiKey',
            message: 'Enter API key:',
            validate: input => input.length > 0 || 'API key is required'
        },
        {
            type: 'input',
            name: 'alias',
            message: 'Enter alias (optional):',
            default: ''
        }
    ]);

    const spinner = ora('Validating API key...').start();

    try {
        const Provider = PROVIDERS[answers.provider].class;
        const provider = new Provider(answers.apiKey);
        await provider.getQuota();

        spinner.succeed('API key validated!');

        storage.addAPI(answers.provider, answers.apiKey, {
            alias: answers.alias || answers.provider
        });

        console.log(chalk.green(`\n✅ ${PROVIDERS[answers.provider].name} added successfully!`));
        console.log(chalk.gray(`\nRun ${chalk.cyan('api-quota-watch monitor')} to check quota status.\n`));

    } catch (error) {
        spinner.fail('Validation failed');
        console.log(chalk.red(`\n❌ Error: ${error.message}\n`));
        process.exit(1);
    }
}

module.exports = add;
