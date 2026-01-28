# 🚀 API Quota Watch

[![npm version](https://badge.fury.io/js/%40gwthm%2Fapi-quota-watch.svg)](https://www.npmjs.com/package/@gwthm/api-quota-watch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/gowthamtadala/api-quota-watch?style=social)](https://github.com/gowthamtadala/api-quota-watch/stargazers)

Never hit rate limits again. Monitor API quotas across OpenAI, Stripe, GitHub, and more from your terminal.

## 🚀 Quick Start

```bash
npm install -g @gwthm/api-quota-watch
aqw add
aqw monitor
```

## Features

- ⚡ Cross-platform (macOS, Linux, Windows)
- 🎯 Multi-API support (OpenAI, Stripe, GitHub)
- 🔔 Proactive alerts
- 📊 Historical tracking
- 🔐 Secure local storage

## Installation

```bash
npm install -g @gwthm/api-quota-watch
```

## Usage

### Add API
```bash
aqw add
```

### Monitor Quotas
```bash
aqw monitor
```

### Watch Mode
```bash
aqw monitor --watch --interval 5
```

### List APIs
```bash
aqw list
```

### Configure Alerts
```bash
aqw alert
```

## Supported Providers

- **OpenAI** - Monitor billing usage and limits
- **Stripe** - Track rate limits per second
- **GitHub** - Watch API request quotas

More coming soon!

## Commands

| Command | Description | Options |
|---------|-------------|---------|
| `aqw add` | Add an API to monitor | Interactive prompts |
| `aqw remove <provider>` | Remove an API | Provider name required |
| `aqw list` | List all configured APIs | - |
| `aqw monitor` | Check quota status | `-w, --watch` for continuous mode<br>`-i, --interval <minutes>` check interval |
| `aqw alert` | Configure alert thresholds | Interactive prompts |

## How It Works

1. **Secure Storage**: API keys are encrypted and stored locally on your machine
2. **Real-time Monitoring**: Check quota usage across all your APIs with a single command
3. **Smart Alerts**: Get notified when you're approaching limits (80%, 90%, 95%)
4. **Historical Tracking**: View 30-day quota history for trend analysis

## Storage Location

Your configuration is stored securely at:
- **macOS/Linux**: `~/.config/api-quota-watch/`
- **Windows**: `%APPDATA%/api-quota-watch/`

All API keys are encrypted using a unique key generated on first use.

## Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/api-quota-watch.git
cd api-quota-watch

# Install dependencies
npm install

# Link for local testing
npm link

# Test the CLI
aqw --help
```

### Run Tests

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Roadmap

- [ ] Additional providers (Anthropic, AWS, Twilio)
- [ ] Cloud sync for Pro tier
- [ ] Slack/Discord webhook notifications
- [ ] Export quota history to CSV
- [ ] Desktop notifications
- [ ] VS Code extension

## License

MIT

## Author

Built with ❤️ by developers who got paged at 2am too many times.

---

**Never hit rate limits again.** Start monitoring your APIs today!
