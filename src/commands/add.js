const inquirer = require('inquirer');
const chalk    = require('chalk');
const ora      = require('ora');
const storage  = require('../utils/storage');
const OpenAIProvider    = require('../providers/openai');
const AnthropicProvider = require('../providers/anthropic');
const GroqProvider      = require('../providers/groq');
const MistralProvider   = require('../providers/mistral');
const OpenRouterProvider = require('../providers/openrouter');
const StripeProvider    = require('../providers/stripe');
const GitHubProvider    = require('../providers/github');

const PROVIDERS = {
    // ── AI / LLM ──────────────────────────────────────────────────────────────
    openai: {
        name:      'OpenAI',
        keyFormat: 'sk-...',
        class:     OpenAIProvider
    },
    anthropic: {
        name:      'Anthropic (Claude)',
        keyFormat: 'sk-ant-...',
        class:     AnthropicProvider
    },
    groq: {
        name:      'Groq',
        keyFormat: 'gsk_...',
        class:     GroqProvider
    },
    mistral: {
        name:      'Mistral AI',
        keyFormat: 'your Mistral API key',
        class:     MistralProvider
    },
    openrouter: {
        name:      'OpenRouter',
        keyFormat: 'sk-or-...',
        class:     OpenRouterProvider
    },
    // ── Developer APIs ────────────────────────────────────────────────────────
    stripe: {
        name:      'Stripe',
        keyFormat: 'sk_live_... or sk_test_...',
        class:     StripeProvider
    },
    github: {
        name:      'GitHub',
        keyFormat: 'ghp_...',
        class:     GitHubProvider
    }
};

async function add() {
    console.log(chalk.bold.cyan('\n🔐 Add API to Monitor\n'));

    const existingApis = storage.getAPIs();

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'provider',
            message: 'Select API provider:',
            choices: Object.keys(PROVIDERS).map(key => ({
                name: `${PROVIDERS[key].name}  ${chalk.gray('(' + PROVIDERS[key].keyFormat + ')')}`,
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
            message: 'Alias (e.g. your name or project, optional):',
            default: (ans) => existingApis[ans.provider]?.alias || ''
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
        console.log(chalk.gray(`\nRun ${chalk.cyan('aqw monitor')} to check quota status.\n`));

    } catch (error) {
        spinner.warn('Could not validate API key');
        console.log(chalk.yellow(`\n⚠️  Warning: ${error.message}`));

        const proceed = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'addAnyway',
                message: 'Add API anyway? (You can validate it later)',
                default: true
            }
        ]);

        if (proceed.addAnyway) {
            storage.addAPI(answers.provider, answers.apiKey, {
                alias: answers.alias || answers.provider
            });
            console.log(chalk.green(`\n✅ ${PROVIDERS[answers.provider].name} added!`));
            console.log(chalk.gray(`\nRun ${chalk.cyan('aqw monitor')} to check quota status.\n`));
        } else {
            console.log(chalk.gray('\nCancelled.\n'));
            process.exit(0);
        }
    }
}

module.exports = add;
