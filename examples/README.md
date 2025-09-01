# 📚 Examples - Multichain Seed SDK

This folder contains practical examples demonstrating how to use the Multichain Seed SDK for different use cases.

## 🚀 Quick Start

First, build the project and install dependencies:

```bash
npm install
npm run build
```

## 📖 Available Examples

### 1. Basic Usage (`basic-usage.js`)
**Perfect for beginners** - Shows the fundamental usage of the SDK.

**What it demonstrates:**
- Converting a mnemonic to seed
- Deriving addresses for all supported chains
- Basic output formatting

**Run it:**
```bash
node examples/basic-usage.js
```

**Use case:** Getting started with the SDK, understanding basic functionality.

---

### 2. Advanced Derivation (`advanced-derivation.js`)
**For intermediate users** - Demonstrates advanced derivation features.

**What it demonstrates:**
- Multiple accounts and indices
- Change addresses (internal/external)
- Custom derivation paths
- Solana Trust Wallet style derivation
- Batch address generation

**Run it:**
```bash
node examples/advanced-derivation.js
```

**Use case:** Building wallets, managing multiple accounts, advanced key management.

---

### 3. TypeScript Example (`typescript-example.ts`)
**For TypeScript developers** - Shows type safety and advanced patterns.

**What it demonstrates:**
- Full TypeScript type safety
- Advanced type usage patterns
- Building reusable functions
- Error handling with proper types
- Chain configuration management

**Run it:**
```bash
# First compile TypeScript
npx tsc examples/typescript-example.ts --target ES2020 --module ES2020 --outDir examples/dist
# Then run
node examples/dist/typescript-example.js
```

**Use case:** Building production applications, maintaining type safety, creating reusable libraries.

---

## 🔧 Example Mnemonics

All examples use **test mnemonics** that are publicly known and safe for demonstration:

- **12 words**: `"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"`
- **24 words**: `"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"`

⚠️ **Never use these mnemonics in production!** They are publicly known and have no security value.

## 🎯 Use Cases

### For Developers
- **Learning**: Start with `basic-usage.js` to understand the API
- **Integration**: Use `advanced-derivation.js` to see real-world patterns
- **Production**: Reference `typescript-example.ts` for type-safe implementations

### For Applications
- **Wallet Apps**: Generate addresses for multiple chains
- **Key Management**: Handle different derivation strategies
- **Testing**: Validate address generation logic
- **Documentation**: Show users how to integrate the SDK

## 🔗 Integration Examples

### Node.js / CommonJS
```javascript
const { mnemonicToSeed, deriveAddressForChain } = require('@nawab69/multichain-sdk')
```

### ES Modules
```javascript
import { mnemonicToSeed, deriveAddressForChain } from '@nawab69/multichain-sdk'
```

### TypeScript
```typescript
import { mnemonicToSeed, deriveAddressForChain, type Chain } from '@nawab69/multichain-sdk'
```

## 🧪 Testing Examples

You can also test the examples with your own mnemonic by modifying the mnemonic variable in each file:

```javascript
// Replace this line in any example
const mnemonic = "your twelve or twenty four words here"
```

## 📚 Next Steps

After running the examples:

1. **Read the main README.md** for complete API documentation
2. **Check the tests/** folder for edge cases and validation
3. **Explore the source code** in `src/` to understand implementation details
4. **Build your own examples** based on these patterns

## 🤝 Contributing

Found a bug or want to add an example? 

1. Fork the repository
2. Create a new example file
3. Update this README
4. Submit a pull request

## 📄 License

These examples are part of the Multichain Seed SDK and are licensed under the MIT License.
