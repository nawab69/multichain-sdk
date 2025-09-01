# 📦 Publishing Guide - Multichain Seed SDK

This guide explains how to publish the Multichain Seed SDK to npm and manage releases.

## 🚀 Prerequisites

### 1. npm Account Setup
```bash
# Login to npm
npm login

# Verify your account
npm whoami
```

### 2. GitHub Repository Setup
- Repository must be public (for free npm packages)
- Repository must have proper package.json configuration
- Repository must have GitHub Actions workflows

### 3. Required Secrets
Set these secrets in your GitHub repository:

- `NPM_TOKEN`: Your npm authentication token
- `GITHUB_TOKEN`: GitHub token (usually auto-provided)

## 📋 Pre-Publishing Checklist

Before publishing, ensure:

- [ ] All tests pass (`npm run test:run`)
- [ ] Build is successful (`npm run build`)
- [ ] Examples work (`npm run examples`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Version is updated in package.json
- [ ] README.md is up to date
- [ ] Examples are working
- [ ] No sensitive data in code

## 🔄 Publishing Workflow

### Option 1: Automated (Recommended)

1. **Trigger Release Workflow**
   - Go to GitHub Actions → Release Management
   - Click "Run workflow"
   - Choose version bump type (patch/minor/major)
   - Set dry_run to false
   - Click "Run workflow"

2. **Review Release PR**
   - Workflow creates a PR with version bump
   - Review changes and merge

3. **Create GitHub Release**
   - Go to Releases → Draft a new release
   - Tag version: `v1.0.0` (match package.json)
   - Title: `Release v1.0.0`
   - Description: Copy from PR or generate
   - Publish release

4. **Automatic npm Publish**
   - GitHub Actions automatically publishes to npm
   - Check npm package page for new version

### Option 2: Manual Publishing

1. **Update Version**
```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

2. **Build and Test**
```bash
npm run build
npm run test:run
npm run examples
```

3. **Publish to npm**
```bash
npm publish
```

4. **Create Git Tag**
```bash
git push origin main --tags
```

## 🏷️ Version Management

### Semantic Versioning
- **Patch** (1.0.0 → 1.0.1): Bug fixes, no breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

### Version Bumps
```bash
# Bug fix release
npm version patch

# New feature release
npm version minor

# Breaking change release
npm version major
```

## 🔐 npm Configuration

### Package Visibility
```json
{
  "private": false,
  "publishConfig": {
    "access": "public"
  }
}
```

### Files to Include
```json
{
  "files": [
    "dist",
    "examples",
    "README.md",
    "REQUIREMENTS.md"
  ]
}
```

### Exclude from Package
```json
{
  "files": [
    "dist",
    "examples"
  ],
  ".npmignore": [
    "src/",
    "tests/",
    ".github/",
    "*.log",
    "coverage/"
  ]
}
```

## 🚨 Common Issues & Solutions

### 1. Package Already Exists
```bash
# Check if package exists
npm view @nawab69/multichain-sdk

# If exists, update version
npm version patch
npm publish
```

### 2. Authentication Failed
```bash
# Re-login to npm
npm logout
npm login

# Verify token
npm whoami
```

### 3. Build Failed
```bash
# Clean and rebuild
rm -rf dist/
rm -rf node_modules/
npm install
npm run build
```

### 4. TypeScript Errors
```bash
# Check types
npm run typecheck

# Fix any type issues
# Rebuild
npm run build
```

## 📊 Post-Publishing

### 1. Verify Package
```bash
# Install your package
npm install @nawab69/multichain-sdk

# Test in new project
node -e "console.log(require('@nawab69/multichain-sdk'))"
```

### 2. Update Documentation
- Update README.md with new version
- Update examples if needed
- Update any external documentation

### 3. Announce Release
- GitHub release notes
- npm package page
- Social media (if applicable)
- Community channels

## 🔄 Continuous Deployment

### GitHub Actions Workflow
The repository includes automated workflows:

- **CI Pipeline**: Runs on every push/PR
- **Release Management**: Automated version bumping
- **Auto-publish**: Publishes to npm on release

### Workflow Triggers
- **Push to main**: Runs tests and builds
- **Pull Request**: Runs tests
- **Release**: Publishes to npm

## 📈 Monitoring

### npm Analytics
- Visit npm package page
- Check download statistics
- Monitor for issues

### GitHub Insights
- Repository traffic
- Issue reports
- Pull request activity

## 🛡️ Security

### Before Publishing
- [ ] No API keys in code
- [ ] No hardcoded secrets
- [ ] No sensitive data in examples
- [ ] Dependencies are secure

### Security Scanning
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 📚 Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [npm Security](https://docs.npmjs.com/about-audit-reports)

## 🆘 Support

If you encounter issues:

1. Check this guide
2. Review GitHub Actions logs
3. Check npm error messages
4. Open GitHub issue
5. Contact maintainers

---

**Happy Publishing! 🚀**
