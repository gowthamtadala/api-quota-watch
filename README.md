# 🚀 API Quota Watch

[![npm version](https://badge.fury.io/js/%40gwthm%2Fapi-quota-watch.svg)](https://www.npmjs.com/package/@gwthm/api-quota-watch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/gowthamtadala/api-quota-watch?style=social)](https://github.com/gowthamtadala/api-quota-watch/stargazers)

**Never hit API rate limits again.** Monitor AI tools and API quotas across OpenAI, Anthropic (Claude), Stripe, GitHub, and more — directly from your terminal.

```bash
npm install -g @gwthm/api-quota-watch
aqw add        # add your first API
aqw monitor    # check all quotas at once
```

---

## ✨ What's New in v0.2.0

- 🤖 **Anthropic / Claude** provider — monitor token & request rate limits
- 📈 **`aqw history`** — 30-day sparkline charts, trend arrows, burn rate projections
- 📊 **`aqw report`** — structured JSON/CSV export for spreadsheets or automation
- 🔔 **Real webhook alerts** — Slack Block Kit + Discord embeds that actually fire
- ⚡ **Burn rate** — "At current pace, limit in ~12 days" alongside every provider
- 🎨 **Richer monitor output** — inline progress bars with absolute values

---

## 🚀 Quick Start

```bash
# Install
npm install -g @gwthm/api-quota-watch

# Add APIs (OpenAI, Anthropic, Stripe, GitHub)
aqw add

# Check all quotas
aqw monitor

# Continuous watch mode
aqw monitor --watch --interval 5

# 30-day history chart
aqw history

# Structured export
aqw report --format json --output report.json
```

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `aqw add` | Add an API key to monitor (interactive) |
| `aqw remove <provider>` | Remove a provider |
| `aqw list` | List all configured APIs |
| `aqw monitor` | Check live quota status with progress bars |
| `aqw monitor --watch --interval 5` | Continuous monitoring every N minutes |
| `aqw alert` | Configure Slack/Discord/webhook alerts |
| `aqw history [provider]` | Sparkline trend chart + burn rate |
| `aqw history --days 7` | Last 7 days only |
| `aqw report` | Rich terminal report |
| `aqw report --format json` | JSON export |
| `aqw report --format csv --output report.csv` | CSV export for spreadsheets |
| `aqw report --cached` | Use stored data (no live API calls) |

---

## 🔌 Supported Providers

| Provider | Category | What's Monitored | Key format |
|----------|----------|-----------------|------------|
| **OpenAI** | AI | Monthly billing usage vs. hard limit | `sk-...` |
| **Anthropic (Claude)** | AI | Token & request rate limits | `sk-ant-...` |
| **Groq** | AI | Token & request rate limits per minute | `gsk_...` |
| **Mistral AI** | AI | Token & request rate limits per minute | Mistral console key |
| **OpenRouter** | AI (multi-model) | Credit balance (`limit_remaining`) in USD | `sk-or-...` |
| **Stripe** | Payments | Rate limits per second | `sk_live_...` / `sk_test_...` |
| **GitHub** | Dev tools | Core API request quota (5,000/hr) | `ghp_...` |

More coming: AWS Bedrock, Cohere, Twilio

---

## 🔔 Alerts

Configure per-provider alerts with a real notification destination:

```bash
aqw alert
# → select provider
# → set threshold (e.g. 80%)
# → choose: Slack | Discord | Generic JSON | None
# → paste webhook URL
# → send a test alert now? [y/n]
```

Alert format on Slack (Block Kit):

```
🚨 Quota Alert: openai
🔴 openai: 85.0% (85.00/100 USD)
Reported at 8/5/2026 via `aqw`
```

---

## 📈 History & Burn Rate

```bash
aqw history openai
```

```
  openai
  ──────────────────────────────────────────────────
  ▁▁▂▂▃▃▄▄▅▅▆▆▇▇▇▇▇▇▇██
    min 12.4%  avg 45.1%  max 87.3%  trend ↑
    Jul 7, 2026 → Aug 5, 2026

  Latest: ████████░░░░░░░░ 48.2% (48.20/100 USD)
  ⚡ At current pace: limit in ~18 days

  30 data points collected
```

---

## 📊 Report Export

```bash
aqw report --format json
```

```json
{
  "reportedAt": "2026-08-05T22:00:00.000Z",
  "reporter": "my-macbook",
  "version": "0.2.0",
  "apis": [
    {
      "provider": "openai",
      "alias": "openai",
      "usedPercent": 48.2,
      "used": 48.2,
      "limit": 100,
      "unit": "USD",
      "resetsAt": "2026-09-01T00:00:00.000Z",
      "dataSource": "live"
    }
  ]
}
```

---

## 🔐 Security

- API keys stored locally in your OS config directory
- macOS/Linux: `~/.config/api-quota-watch/`
- Windows: `%APPDATA%\api-quota-watch\`
- Zero keys sent to any external server

---

## 🗺 Roadmap

- [x] v0.1.0 — OpenAI, Stripe, GitHub + watch mode + alerts config
- [x] v0.2.0 — Anthropic, sparkline history, real webhook alerts, report export
- [ ] v0.3.0 — Scheduled daily digests, desktop notifications, VS Code extension
- [ ] v0.4.0 — Team reporting: opt-in Slack digest for engineering managers

---

## 🤝 Contributing

```bash
git clone https://github.com/gowthamtadala/api-quota-watch.git
cd api-quota-watch
npm install
npm link     # makes `aqw` available locally
aqw --help
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## ⚠️ GitHub Action

Run quota checks inside CI and gate on usage thresholds. Keys come from GitHub Secrets — nothing interactive.

```yaml
- name: Check API quotas
  id: quotas
  uses: gowthamtadala/api-quota-watch@v1
  with:
    keys: '{"openai":"${{ secrets.OPENAI_API_KEY }}","anthropic":"${{ secrets.ANTHROPIC_API_KEY }}"}'
    threshold: '90'   # optional, default 95

- name: Fail if any quota is breached
  if: steps.quotas.outputs.threshold-breached == 'true'
  run: echo "API quota threshold breached" && exit 1
```

**Inputs**

| Input | Required | Default | Description |
|---|---|---|---|
| `keys` | yes | — | JSON object mapping provider → API key. Providers: `openai`, `anthropic`, `groq`, `mistral`, `openrouter`, `stripe`, `github`. |
| `version` | no | `latest` | Version of `@gwthm/api-quota-watch` to install from npm. |
| `threshold` | no | `95` | Usage percent (0–100) at or above which a provider counts as breached. |

**Outputs**

| Output | Description |
|---|---|
| `report-json` | Quota report as JSON (same schema as `aqw report --format json`). |
| `threshold-breached` | `true` if any provider's usage percent is at or above `threshold`, else `false`. |

---

## 📄 License

MIT — Built with ❤️ by developers who got paged at 2am too many times.
