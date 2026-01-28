# Contributing to API Quota Watch

Thank you for your interest in contributing! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version)

### Suggesting Features

Feature requests are welcome! Please:
- Describe the feature clearly
- Explain why it would be useful
- Provide examples if possible

### Adding New API Providers

Want to add support for a new API? Great! Here's how:

1. **Create Provider File**
   - Create `src/providers/yourapi.js`
   - Implement `getQuota()` method
   - Return: `{ used, limit, unit, resetsAt, details }`

2. **Example Provider Structure:**
```javascript
const axios = require('axios');

class YourAPIProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.yourservice.com';
    }

    async getQuota() {
        // Fetch quota data
        const response = await axios.get(`${this.baseURL}/quota`, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });

        return {
            used: response.data.used,
            limit: response.data.limit,
            unit: 'requests/hour',
            resetsAt: response.data.reset_time
        };
    }
}

module.exports = YourAPIProvider;
```

3. **Update Commands**
   - Add provider to `src/commands/add.js` PROVIDERS list
   - Add to `src/commands/monitor.js` PROVIDER_CLASSES

4. **Test It**
```bash
npm link
aqw add    # Test adding your provider
aqw monitor # Test monitoring
```

5. **Submit PR**
   - Fork the repo
   - Create feature branch: `git checkout -b add-yourapi-provider`
   - Commit changes: `git commit -m "Add YourAPI provider support"`
   - Push and create Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/api-quota-watch.git
cd api-quota-watch

# Install dependencies
npm install

# Link for local testing
npm link

# Test your changes
aqw --help
```

## Code Style

- Use consistent indentation (4 spaces)
- Add comments for complex logic
- Follow existing code patterns
- Keep functions focused and small

## Pull Request Process

1. Update README if adding features
2. Test your changes thoroughly
3. Write clear commit messages
4. Reference any related issues
5. Wait for review and address feedback

## Questions?

Feel free to open an issue for any questions!

Thank you for contributing! 🚀
