# CodeQL Workflow Documentation

## Overview

The CodeQL workflow performs static code analysis to identify security vulnerabilities and code quality issues in the JavaScript/TypeScript codebase. It uses GitHub's advanced semantic code analysis engine to detect potential security problems before they reach production.

## Workflow Details

**File:** [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml)  
**Name:** CodeQL  
**Trigger:** Manual dispatch (`workflow_dispatch`)

### Jobs

#### `analyze`
Performs CodeQL analysis on the codebase for JavaScript/TypeScript code.

**Runner:** `ubuntu-latest`

**Permissions:**
- `actions: read` - Read workflow artifacts
- `contents: read` - Read repository contents
- `security-events: write` - Upload security analysis results

**Matrix Strategy:**
- Language: `javascript-typescript`
- Fail-fast: Disabled (continues even if one analysis fails)

### Workflow Steps

1. **Checkout** - Checks out the repository code
   - Action: `actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5` (v4)

2. **Initialize CodeQL** - Sets up the CodeQL analysis environment
   - Action: `github/codeql-action/init@3b1a19a80ab047f35cbb237b5bd9bdc1e14f166c` (v3)
   - Configures language scanning for JavaScript/TypeScript

3. **Autobuild** - Automatically builds the project if needed
   - Action: `github/codeql-action/autobuild@3b1a19a80ab047f35cbb237b5bd9bdc1e14f166c` (v3)
   - Detects and runs build commands for JavaScript projects

4. **Perform CodeQL Analysis** - Runs the analysis and uploads results
   - Action: `github/codeql-action/analyze@3b1a19a80ab047f35cbb237b5bd9bdc1e14f166c` (v3)
   - Uploads findings to GitHub Security tab

## Running the Workflow

### Method 1: Using the Validation Script (Recommended)

A validation and trigger script is provided to make it easy to validate and run the workflow:

```bash
./scripts/run-codeql-workflow.sh
```

This script will:
1. Validate YAML syntax (if `yq` is installed)
2. Check workflow structure and required fields
3. Run `actionlint` validation (if installed)
4. Optionally trigger the workflow on GitHub

**Optional Tool Installation:**
```bash
# Install YAML validator
brew install yq

# Install GitHub Actions linter
brew install actionlint

# Install GitHub CLI (required for triggering)
brew install gh
gh auth login
```

### Method 2: Using GitHub CLI

Trigger the workflow manually from the command line:

```bash
# Trigger on current branch
gh workflow run codeql.yml

# Trigger on specific branch
gh workflow run codeql.yml --ref branch-name

# View workflow runs
gh run list --workflow=codeql.yml

# Watch the latest run
gh run watch
```

### Method 3: Using GitHub Web Interface

1. Navigate to the repository on GitHub
2. Go to the **Actions** tab
3. Select **CodeQL** from the workflows list
4. Click **Run workflow**
5. Select the branch to analyze
6. Click **Run workflow** button

## Viewing Results

### Security Alerts

CodeQL findings are automatically uploaded to GitHub's Security tab:

1. Navigate to the **Security** tab in the repository
2. Click **Code scanning alerts**
3. Review any identified vulnerabilities or code quality issues

### Workflow Logs

To view detailed execution logs:

```bash
# View latest run
gh run view --workflow=codeql.yml

# View specific run
gh run view <run-id>

# View logs in browser
gh run view <run-id> --web
```

Or via the GitHub web interface:
1. Go to **Actions** tab
2. Click on the workflow run
3. Expand the job steps to see detailed logs

## Understanding Results

### Severity Levels

- **Critical** - Severe security vulnerabilities requiring immediate attention
- **High** - Significant security issues that should be addressed soon
- **Medium** - Moderate security concerns or code quality issues
- **Low** - Minor issues or potential improvements

### Common Findings

CodeQL may identify:
- **SQL Injection** vulnerabilities
- **Cross-Site Scripting (XSS)** issues
- **Path Traversal** risks
- **Command Injection** vulnerabilities
- **Insecure randomness**
- **Resource exhaustion**
- **Authentication/Authorization** problems
- **Code quality** issues

## Maintenance

### Updating CodeQL Actions

The workflow uses pinned SHA versions for security. To update:

1. Check for new versions at [github/codeql-action releases](https://github.com/github/codeql-action/releases)
2. Update the SHA in the workflow file
3. Test the workflow on a feature branch
4. Merge after successful validation

Example update:
```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@<new-sha-here> # v3
```

### Adding Additional Languages

To analyze other languages (e.g., Python, Go, Java):

1. Edit [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml)
2. Add to the matrix strategy:
```yaml
matrix:
  language: ['javascript-typescript', 'python', 'go']
```

Supported languages:
- `javascript-typescript`
- `python`
- `java`
- `cpp`
- `csharp`
- `go`
- `ruby`

### Custom Queries

To add custom CodeQL queries or query suites:

```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@sha
  with:
    languages: ${{ matrix.language }}
    queries: security-extended,security-and-quality
```

Available query suites:
- `security-extended` - Extended security queries
- `security-and-quality` - Security + code quality queries
- Custom `.ql` or `.qls` files in the repository

## Troubleshooting

### Workflow Fails to Trigger

**Issue:** "Workflow does not have 'workflow_dispatch' trigger"

**Solution:** Ensure the workflow file contains:
```yaml
on:
  workflow_dispatch:
```

This is already configured in the current workflow.

### Build Failures

**Issue:** Autobuild step fails

**Solutions:**
1. Check that `package.json` has valid scripts
2. Ensure dependencies can be installed
3. Add manual build commands if needed:
```yaml
- name: Build
  run: |
    cd backend && npm ci
    cd ../frontend && npm ci && npm run build
```

### Out of Memory

**Issue:** Analysis runs out of memory

**Solutions:**
1. Exclude large generated files
2. Add a `.github/codeql/codeql-config.yml`:
```yaml
paths-ignore:
  - 'node_modules/**'
  - 'dist/**'
  - 'build/**'
```

### Permission Errors

**Issue:** Cannot upload SARIF results

**Solution:** Verify permissions in workflow:
```yaml
permissions:
  security-events: write
  contents: read
  actions: read
```

## Best Practices

1. **Run Regularly** - Schedule regular scans (e.g., weekly) or on pull requests
2. **Address Findings Promptly** - Triage and fix vulnerabilities based on severity
3. **Keep Actions Updated** - Regularly update CodeQL actions to get latest detection rules
4. **Review False Positives** - Mark legitimate false positives to reduce noise
5. **Integrate with CI/CD** - Consider adding automatic PR checks
6. **Document Suppressions** - If suppressing alerts, document why

## Scheduling Automatic Runs

To run CodeQL automatically, add schedule triggers:

```yaml
on:
  workflow_dispatch:
  schedule:
    # Run every Monday at 9 AM UTC
    - cron: '0 9 * * 1'
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

## Resources

- [CodeQL Documentation](https://codeql.github.com/docs/)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)
- [CodeQL Query Help](https://codeql.github.com/codeql-query-help/)
- [Security Best Practices](https://docs.github.com/en/code-security/getting-started/securing-your-repository)

## Related Workflows

- [security-scan.yml](security-scan.md) - Container and dependency vulnerability scanning
- [dependency-guard.yml](dependency-guard.md) - Dependency validation and management

## Support

For issues with the workflow:
1. Check the troubleshooting section above
2. Review workflow logs for specific errors
3. Consult GitHub's CodeQL documentation
4. Open an issue if problems persist
