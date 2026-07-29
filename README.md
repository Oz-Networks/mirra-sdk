# Mirra SDK

Official SDKs, templates, and tools for building on the Mirra platform.

## 📦 Packages

### TypeScript/JavaScript SDK
- **Location**: [`packages/mirra-sdk-js/`](./packages/mirra-sdk-js/)
- **npm**: `@mirra-messenger/sdk`
- **Install**: `npm install @mirra-messenger/sdk`
- **Docs**: [README](./packages/mirra-sdk-js/README.md)

### Python SDK
- **Location**: [`packages/mirra-sdk-python/`](./packages/mirra-sdk-python/)
- **PyPI**: `mirra-sdk`
- **Install**: `pip install mirra-sdk`
- **Docs**: [README](./packages/mirra-sdk-python/README.md)

## 🎨 Templates

Pre-built templates for common use cases:
- **Location**: [`templates/`](./templates/)
- **Browse**: [Templates Directory](./templates/)

## 🔌 Claude Code Plugin

The team work-ledger, pages teammates can comment on, and every Mirra
integration as a skill — namespaced as `/mirra:ledger`, `/mirra:google-gmail`,
and so on.

```bash
claude plugin marketplace add Oz-Networks/mirra-sdk
claude plugin install mirra@mirra
```

- **Location**: [`plugins/mirra/`](./plugins/mirra/)
- Updates arrive on their own — Claude Code refreshes the marketplace at session start
- Upgrading from the old loose skills? `curl -fsSL https://raw.githubusercontent.com/Oz-Networks/mirra-sdk/main/skills/install.sh | bash`

## 📚 Documentation

- [Getting Started Guide](./GETTING_STARTED_WITH_SDKS.md)
- [Publishing Guide](./PUBLISHING_GUIDE.md)
- [SDK Implementation Summary](./SDK_IMPLEMENTATION_SUMMARY.md)
- [SDK Packages Summary](./SDK_PACKAGES_SUMMARY.md)

## 🚀 Quick Start

### TypeScript

```typescript
import { MirraSDK } from '@mirra-messenger/sdk';

const mirra = new MirraSDK({ apiKey: 'your_api_key' });

// Create a memory
const memory = await mirra.memory.create({
  content: 'Important information',
  type: 'note'
});

// Chat with AI
const response = await mirra.ai.chat({
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Python

```python
from mirra import MirraSDK

mirra = MirraSDK(api_key='your_api_key')

# Create a memory
memory = mirra.memory.create({
    'content': 'Important information',
    'type': 'note'
})

# Chat with AI
response = mirra.ai.chat({
    'messages': [{'role': 'user', 'content': 'Hello!'}]
})
```

## 🔗 Links

- **Documentation**: https://docs.getmirra.app
- **Website**: https://getmirra.app
- **npm Package**: https://www.npmjs.com/package/@mirra-messenger/sdk
- **PyPI Package**: https://pypi.org/project/mirra-sdk/

## 📄 License

MIT License - see individual package LICENSE files for details.

## 🤝 Contributing

This repository is automatically synced from our main monorepo. For contributions:
1. Visit https://docs.getmirra.app
2. Open an issue or discussion
3. Contact: support@getmirra.app

---

**Note**: This repository is automatically synced from our private monorepo. Direct commits here will be overwritten.
