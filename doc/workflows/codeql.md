# CodeQL Workflow Documentation

## Overview

The CodeQL workflow performs static code analysis to identify security vulnerabilities and code quality issues in the JavaScript/TypeScript codebase. It uses GitHub's advanced semantic code analysis engine to detect potential security problems before they reach production.

## Workflow Details

**File:** [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml)  
**Name:** CodeQL  

**Triggers:** 

- Pull requests to `integration` branch (automatic)
- Pushes to `integration` branch (automatic)
- Manual dispatch (`workflow_dispatch`)

**Monitored Paths:**

- `backend/**` - Backend code changes
- `frontend/**` - Frontend code changes
- `.github/workflows/codeql.yml` - Workflow file changes

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

### Automatic Execution (Default)

The workflow **automatically runs** when:

1. **Pull Request to integration** - CodeQL scans all code changes before merging
   - Open a PR targeting the `integration` branch
   - The workflow runs automatically on PR creation and updates
   - Results appear in the PR checks

2. **Push to integration** - Continuous security scanning
   - When code is merged to `integration`
   - Provides ongoing security monitoring

**Scope:** Only runs when changes are made to:

- Backend code (`backend/**`)
- Frontend code (`frontend/**`)
- The workflow file itself

### Manual Execution (Optional)

#### Method 1: Using the Validation Script

A validation and trigger script is provided to validate and manually run the workflow:

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

# Install GitHub CLI (required for manual triggering)
brew install gh
gh auth login
```

**Note:** Manual triggering via `workflow_dispatch` requires the workflow to exist on the repository's default branch. Use automatic PR triggers instead.

#### Method 2: Using GitHub CLI

Trigger the workflow manually from the command line:

```bash
# View workflow runs
gh run list --workflow=codeql.yml

# Watch the latest run
gh run watch
```

#### Method 3: Using GitHub Web Interface

For manual triggers only (requires workflow on default branch):

1. Navigate to the repository on GitHub
2. Go to the **Actions** tab
3. Select **CodeQL** from the workflows list
4. Click **Run workflow**
5. Select the branch to analyze
6. Click **Run workflow** button

## Viewing Results

### In Pull Requests (Primary Method)

When CodeQL runs on a PR, results appear directly in the pull request:

1. Open your pull request on GitHub
2. Check the **Checks** tab to see CodeQL status
3. Click on the CodeQL check for detailed findings
4. Any security issues will be highlighted with annotations

### Security Alerts

CodeQL findings are automatically uploaded to GitHub's Security tab:

1. Navigate to the **Security** tab in the repository
2. Click **Code scanning alerts**
3. Review any identified vulnerabilities or code quality issues
4. Filter by branch, severity, or rule to focus on specific issues

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

### Workflow Doesn't Run on Pull Request

**Issue:** CodeQL workflow doesn't execute when opening a PR

**Solutions:**

1. Verify the PR is targeting the `integration` branch
2. Check that changes include monitored paths (`backend/**`, `frontend/**`, or workflow file)
3. View the Actions tab to see if the workflow was skipped
4. Ensure GitHub Actions are enabled for the repository

### Manual Trigger Fails

**Issue:** "Workflow does not have 'workflow_dispatch' trigger"

**Solution:** The `workflow_dispatch` trigger requires the workflow file to exist on the repository's default branch (usually `main`).

**Workaround:** Use the automatic PR triggers instead, or merge the workflow to the default branch first.

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

## Current Automatic Triggers

The workflow is already configured to run automatically:

```yaml
on:
  pull_request:
    branches: [ integration ]
    paths:
      - 'backend/**'
      - 'frontend/**'
      - '.github/workflows/codeql.yml'
  push:
    branches: [ integration ]
    paths:
      - 'backend/**'
      - 'frontend/**'
      - '.github/workflows/codeql.yml'
  workflow_dispatch:
```

### Adding Scheduled Scans (Optional)

To add periodic scans (e.g., weekly) even without code changes:

```yaml
on:
  pull_request:
    branches: [ integration ]
  push:
    branches: [ integration ]
  schedule:
    # Run every Monday at 9 AM UTC
    - cron: '0 9 * * 1'
  workflow_dispatch:
```

**Note:** Scheduled runs don't use path filters and will scan the entire codebase.

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
