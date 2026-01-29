# 🚀 API Quota Watch - From Idea to npm in One Weekend

**How I built and published a developer tool that's now live on npm**

**Published Package:** [`@gwthm/api-quota-watch`](https://www.npmjs.com/package/@gwthm/api-quota-watch)  
**GitHub:** [github.com/gowthamtadala/api-quota-watch](https://github.com/gowthamtadala/api-quota-watch)  
**Website:** [apiquotawatch.com](https://apiquotawatch.com)

---

## 📋 Table of Contents

1. [The Problem](#the-problem)
2. [Market Validation](#market-validation)
3. [What I Built](#what-i-built)
4. [Technical Architecture](#technical-architecture)
5. [The Build Process](#the-build-process)
6. [Challenges & Solutions](#challenges-solutions)
7. [Publishing to npm](#publishing-to-npm)
8. [Results & Metrics](#results-metrics)
9. [Next Steps](#next-steps)
10. [Lessons Learned](#lessons-learned)

---

## 🎯 The Problem {#the-problem}

As a developer working with multiple APIs (OpenAI, Stripe, GitHub), I kept hitting rate limits unexpectedly, causing:
- Production failures at 2am
- Failed transactions
- Angry users
- Wasted debugging time

**The gap:** No simple, cross-platform tool to monitor quota usage across multiple APIs.

---

## 📊 Market Validation {#market-validation}

### Research Findings

**Existing Solutions:**
- **Quotio**: macOS-only menu bar app (3,100 GitHub stars in 3 months)
- **Datadog/New Relic**: Enterprise tools ($69-1000+/month, overkill for quota monitoring)
- **Manual checking**: Logging into each API dashboard individually

**Market Opportunity:**
- 60% of developers use Windows/Linux (Quotio is Mac-only)
- API spending grew from $3.5B to $8.4B (2024-2025)
- No cross-platform CLI tool exists

**Conclusion:** Clear market gap for a free, cross-platform CLI tool.

---

## 💡 What I Built {#what-i-built}

### Core Features (v0.1.0)

**Installation:**
```bash
npm install -g @gwthm/api-quota-watch
```

**Commands:**
```bash
# Add an API to monitor
aqw add

# Check quota status
aqw monitor

# List configured APIs
aqw list

# Watch mode (continuous monitoring)
aqw monitor --watch --interval 5

# Configure alerts
aqw alert
```

**Supported Providers:**
- OpenAI (GPT-4, ChatGPT)
- Stripe (payments)
- GitHub (API rate limits)

**Key Differentiators:**
- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ Secure local storage (encrypted API keys)
- ✅ Free and open-source (MIT license)
- ✅ Beautiful terminal UI with colors and tables
- ✅ 30-day quota history tracking

---

## 🏗️ Technical Architecture {#technical-architecture}

### Tech Stack

**Core:**
- **Node.js** - Runtime environment
- **Commander.js** - CLI framework
- **Inquirer** - Interactive prompts
- **Axios** - HTTP requests to APIs

**UI/UX:**
- **Chalk** - Terminal colors
- **Ora** - Loading spinners
- **cli-table3** - Formatted tables

**Storage:**
- **Conf** - Encrypted local configuration
- **Crypto** - API key encryption

### Project Structure

```
api-quota-watch/
├── src/
│   ├── index.js              # CLI entry point
│   ├── commands/             # 5 commands (add, remove, list, monitor, alert)
│   │   ├── add.js
│   │   ├── remove.js
│   │   ├── list.js
│   │   ├── monitor.js
│   │   └── alert.js
│   ├── providers/            # API integrations
│   │   ├── openai.js
│   │   ├── stripe.js
│   │   └── github.js
│   └── utils/
│       ├── storage.js        # Encrypted storage
│       └── formatter.js      # Pretty output
├── tests/
│   └── storage.test.js
├── docs/
│   └── index.html            # Landing page
├── package.json
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

### How It Works

1. **User adds API** → `aqw add`
2. **Credentials encrypted** → Stored locally with Conf
3. **Monitoring** → Fetches quota data from API
4. **Display results** → Color-coded table in terminal
5. **Save history** → 30-day rolling history
6. **Alerts** → Notify when threshold reached

---

## 🔨 The Build Process {#the-build-process}

### Timeline

**Friday Night (4 hours):**
- Project setup and dependencies
- Basic CLI structure
- Storage system

**Saturday (10 hours):**
- API provider integrations (OpenAI, Stripe, GitHub)
- All CLI commands
- Error handling

**Sunday (6 hours):**
- Bug fixes
- Documentation (README, CONTRIBUTING)
- Landing page
- Testing

**Monday (4 hours):**
- npm publishing (including 2FA setup)
- GitHub Pages deployment
- Final polish

**Total: ~24 hours spread over 4 days**

### Key Development Steps

1. **Initialize Project**
   ```bash
   mkdir api-quota-watch
   cd api-quota-watch
   npm init -y
   ```

2. **Install Dependencies**
   ```bash
   npm install commander axios chalk ora conf inquirer cli-table3 date-fns
   npm install -D jest nodemon
   ```

3. **Configure package.json**
   - Set CLI binaries: `api-quota-watch` and `aqw`
   - Add scripts for development
   - Set version to 0.1.0

4. **Build Core Features**
   - Storage system with encryption
   - API provider classes
   - CLI commands
   - Beautiful terminal UI

5. **Test Locally**
   ```bash
   npm link
   aqw --help
   ```

---

## 🐛 Challenges & Solutions {#challenges-solutions}

### Challenge 1: OpenAI Billing API 403 Error

**Problem:** OpenAI's billing API requires special permissions that regular API keys don't have.

**Error:**
```
❌ Error: OpenAI API error: Request failed with status code 403
```

**Solution:**
- Changed validation to use `/models` endpoint (no special permissions needed)
- Added graceful fallback: if billing access unavailable, still allow API addition
- Show helpful message instead of crashing

**Code Fix:**
```javascript
// Validate using models endpoint instead of billing
await axios.get(`${baseURL}/models`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

// Try billing API, but don't fail if unavailable
try {
  const billing = await getBillingData();
} catch (error) {
  return { used: 0, limit: 0, note: 'Billing access required' };
}
```

### Challenge 2: npm Requires 2FA

**Problem:** Couldn't publish to npm without Two-Factor Authentication.

**Error:**
```
npm ERR! 403 You must enable 2FA to publish
```

**Solution:**
1. Set up 2FA at npmjs.com/settings/[username]/tfa
2. Use authenticator app (Google Authenticator)
3. Publish with web-based authentication flow

### Challenge 3: Package Name Already Taken

**Problem:** `api-quota-watch` was available, but npm still required 2FA.

**Solution:**
- Used scoped package: `@gwthm/api-quota-watch`
- Added `--access public` flag
- Updated all documentation with correct package name

### Challenge 4: Conf Package Version Issues

**Problem:** Conf v11+ requires CommonJS compatibility, causing initialization errors.

**Solution:**
- Downgraded to Conf v10.2.0
- Updated storage initialization
- All tests passing

---

## 📦 Publishing to npm {#publishing-to-npm}

### Step-by-Step Process

**1. Prepare for Publishing**
```bash
# Ensure package.json is correct
# Ensure README.md is comprehensive
# Add LICENSE file
# Test thoroughly with `npm link`
```

**2. Check Package Name Availability**
```bash
npm view @gwthm/api-quota-watch
# If 404, name is available!
```

**3. Login to npm**
```bash
npm login
# Opens browser for authentication
```

**4. Enable 2FA**
- Go to npmjs.com → Settings → Two-Factor Authentication
- Choose "Authorization and Publishing"
- Scan QR code with authenticator app

**5. Publish**
```bash
npm publish --access public
# Authenticate in browser
# Package goes live!
```

**6. Verify**
- Visit: https://www.npmjs.com/package/@gwthm/api-quota-watch
- Test installation: `npm install -g @gwthm/api-quota-watch`

### Published Package Info

**Package:** `@gwthm/api-quota-watch@0.1.0`  
**Published:** January 2026  
**License:** MIT  
**Dependencies:** 9 packages (357 total with sub-dependencies)  
**Security:** Zero vulnerabilities

---

## 📈 Results & Metrics {#results-metrics}

### What Was Achieved

**Technical:**
- ✅ Published npm package (globally installable)
- ✅ GitHub repository with clean commit history
- ✅ Comprehensive documentation (README, CONTRIBUTING, LICENSE)
- ✅ Landing page on GitHub Pages
- ✅ Domain purchased (apiquotawatch.com)
- ✅ Zero security vulnerabilities

**Lines of Code:**
- ~1,500 lines of JavaScript
- ~500 lines of documentation
- ~380 lines of HTML (landing page)

**Features:**
- 5 CLI commands fully functional
- 3 API provider integrations
- Encrypted local storage
- Color-coded terminal UI
- 30-day quota history
- Alert configuration

### Success Metrics (Targets)

**Week 1:**
- [ ] 50 GitHub stars
- [ ] 100 npm downloads
- [ ] Landing page live on custom domain

**Month 1:**
- [ ] 200 GitHub stars
- [ ] 1,000 npm downloads
- [ ] Featured in dev newsletter
- [ ] 1 blog post published

**Month 3:**
- [ ] 500 GitHub stars
- [ ] 5,000 npm downloads
- [ ] 5 additional providers
- [ ] Pro tier beta launch

---

## 🚀 Next Steps {#next-steps}

### Marketing & Growth

**Immediate (This Week):**
1. **Set up GitHub Pages** with custom domain
2. **Create demo GIF** using asciinema or terminalizer
3. **Launch on Product Hunt** Monday 9am PST
4. **Post on social media:**
   - Twitter/X thread about the build
   - LinkedIn with technical details
   - Reddit (r/webdev, r/SideProject)

**Content Creation:**
1. **Blog post:** "I Built an npm Package in One Weekend"
2. **Dev.to tutorial:** Full technical walkthrough
3. **YouTube demo:** 5-minute overview video

### Feature Roadmap

**v0.2.0 (Next Month):**
- [ ] Add Anthropic provider
- [ ] Add AWS provider
- [ ] Desktop notifications
- [ ] Export to CSV/JSON

**v0.3.0 (Month 2):**
- [ ] Webhook support (Slack, Discord)
- [ ] Email alerts
- [ ] Web dashboard (read-only)

**v1.0.0 (Month 3):**
- [ ] Pro tier with cloud sync
- [ ] Team features
- [ ] 10+ API providers
- [ ] Mobile app (React Native)

### Monetization Strategy

**Free Tier (Forever):**
- Monitor 3 APIs
- Local storage only
- 7-day history
- Community support

**Pro Tier ($29/month):**
- Unlimited APIs
- Cloud sync across devices
- 90-day history
- Slack/Discord webhooks
- Email alerts
- Priority support

**Team Tier ($99/month):**
- Everything in Pro
- Shared team dashboards
- SSO integration
- Audit logs
- Dedicated support

**Revenue Projections:**
- Month 1: 10 customers = $290 MRR
- Month 3: 50 customers = $1,450 MRR
- Month 6: 300 customers = $8,700 MRR
- Month 12: 600 customers = $17,400 MRR ($208k ARR)

---

## 🎓 Lessons Learned {#lessons-learned}

### What Went Well

1. **MVP-First Approach** - Shipped basic version quickly, can iterate based on feedback
2. **Good Documentation** - README and CONTRIBUTING make project accessible
3. **Error Handling** - Graceful fallbacks prevent crashes
4. **CLI Design** - Simple, intuitive commands
5. **Cross-Platform** - Works everywhere Node.js runs

### What Could Be Better

1. **Testing** - Should have written more unit tests earlier
2. **Demo** - Need video/GIF showing actual usage
3. **Provider Coverage** - Start with more than 3 providers
4. **Analytics** - Should track usage from day 1

### Key Takeaways

**For Fellow Developers:**

1. **Ship Early** - v0.1.0 is enough. Perfect is the enemy of done.
2. **Market Research Matters** - Quotio's success validated the market
3. **Documentation = Marketing** - Good README is your sales page
4. **npm Publishing is Easy** - Once you do it once, it's straightforward
5. **Scoped Packages** - Use `@username/package` to avoid name conflicts

**Technical Insights:**

1. **Commander.js is Powerful** - Makes CLI development a breeze
2. **Conf Handles Everything** - Don't reinvent storage
3. **Chalk Makes It Pop** - Colors greatly improve UX
4. **Error Messages Matter** - Helpful errors = happy users
5. **API Design Varies** - Each provider has quirks (handle gracefully)

---

## 🔗 Resources & Links

### Project Links
- **npm Package:** https://www.npmjs.com/package/@gwthm/api-quota-watch
- **GitHub Repo:** https://github.com/gowthamtadala/api-quota-watch
- **Website:** https://apiquotawatch.com
- **Author:** Gowtham Krishna Tadala

### Inspiration & Research
- **Quotio:** https://github.com/andrewsonin/quotio
- **API Market Size:** Research reports, 2024-2025
- **CLI Best Practices:** GitHub CLI, Vercel CLI

### Tools Used
- **Node.js:** https://nodejs.org/
- **Commander.js:** https://github.com/tj/commander.js
- **npm:** https://www.npmjs.com/
- **GitHub Pages:** https://pages.github.com/

---

## 📝 Installation & Usage

### Quick Start

```bash
# Install globally
npm install -g @gwthm/api-quota-watch

# Add your first API
aqw add

# Monitor all APIs
aqw monitor

# Watch mode (continuous)
aqw monitor --watch --interval 5
```

### Example Output

```
┌──────────┬────────┬──────┬───────┬───────────┬─────────────────────┐
│ Provider │ Status │ Used │ Limit │ Remaining │ Resets              │
├──────────┼────────┼──────┼───────┼───────────┼─────────────────────┤
│ openai   │ 🟢 45% │ 45   │ 100   │ 55        │ 2026-02-01T00:00:00 │
│ stripe   │ 🟡 82% │ 82   │ 100   │ 18        │ 2026-01-30T10:30:00 │
│ github   │ 🟢 12% │ 600  │ 5000  │ 4400      │ 2026-01-30T15:00:00 │
└──────────┴────────┴──────┴───────┴───────────┴─────────────────────┘
```

---

## 🤝 Contributing

Want to add a provider or fix a bug? Contributions are welcome!

1. Fork the repo
2. Create feature branch
3. Make your changes
4. Submit Pull Request

See [CONTRIBUTING.md](https://github.com/gowthamtadala/api-quota-watch/blob/main/CONTRIBUTING.md) for details.

---

## 📄 License

MIT License - See [LICENSE](https://github.com/gowthamtadala/api-quota-watch/blob/main/LICENSE)

---

## 🙏 Acknowledgments

- Inspired by [Quotio](https://github.com/andrewsonin/quotio)
- Thanks to the open-source community
- Built with love and too much coffee ☕

---

**Ready to try it?**

```bash
npm install -g @gwthm/api-quota-watch
aqw --help
```

**Questions or feedback?** Open an issue on [GitHub](https://github.com/gowthamtadala/api-quota-watch/issues)!