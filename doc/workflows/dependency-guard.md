# Dependency Guard Workflow

## Overview

The Dependency Guard workflow enforces security policies on project dependencies to prevent vulnerable or untested packages from entering the codebase. It performs automated checks on both direct and transitive dependencies across the backend and frontend projects.

## When It Runs

The workflow is triggered when:

- **Pull Requests** modify any of these files:
  - `package.json` (any)
  - `backend/package.json`
  - `frontend/package.json`
  - `backend/package-lock.json`
  - `frontend/package-lock.json`
  - `.github/security/blocked-packages.json`
  - `.github/security/dependency-age-policy.json`
  - `scripts/verify-dependencies.js`

- **Push to `integration` branch** with changes to the same files

## Security Checks

### 1. Blocked Packages Check

Prevents known vulnerable or problematic packages from being added to the project.

**How it works:**

- Reads blocklist from `.github/security/blocked-packages.json`
- Scans all packages in `backend/package-lock.json` and `frontend/package-lock.json`
- Fails if any blocked package version is found in the dependency tree

**Configuration:**

```json
{
  "package-name": ["1.0.0", "2.1.3"],
  "another-package": ["*"]
}
```

Use `"*"` to block all versions of a package.

### 2. Dependency Age Policy Check

Enforces a minimum age requirement for dependencies to reduce supply chain attack risk and ensure packages are battle-tested before adoption.

**How it works:**

- Reads policy from `.github/security/dependency-age-policy.json`
- Fetches publish dates from npm registry for each dependency
- Calculates age and compares against minimum requirement
- Supports allowlist for specific versions that need exemption

**Configuration:**

```json
{
  "minimumReleaseAgeDays": 30,
  "includeTransitiveDependencies": true,
  "projects": ["backend", "frontend"],
  "allowFreshVersions": {
    "react": ["18.3.0"],
    "express": ["4.19.0"]
  }
}
```

**Options:**

- `minimumReleaseAgeDays`: Minimum age in days for dependencies (default: 0)
- `includeTransitiveDependencies`: Check transitive dependencies (default: false)
- `projects`: Array of project directories to check (default: ["backend", "frontend"])
- `allowFreshVersions`: Exemptions for specific package versions that can bypass age check

## Running Manually

### Locally

Run the dependency verification script directly:

```bash
npm run security:deps
```

This executes the same checks as the workflow without needing to push code.

### Prerequisites for Local Run

1. Install dependencies first:

```bash
npm ci --prefix backend --ignore-scripts
npm ci --prefix frontend --ignore-scripts
```

1. Run the check:

``` bash
npm run security:deps
```

### In GitHub Actions

To enable manual workflow runs, add `workflow_dispatch` to the workflow triggers:

```yaml
on:
  workflow_dispatch:  # Enable manual runs
  pull_request:
    paths:
      # ... existing paths
```

Then trigger via:

- GitHub UI: Actions → Dependency Guard → Run workflow
- CLI: `gh workflow run dependency-guard.yml`

## Exit Codes

- **0**: All checks passed
- **1**: Policy violations found or unexpected error occurred

## Error Messages

### Blocked Package Violation

``` bash
Blocked dependency found: lodash@4.17.20 in backend/package-lock.json
```

**Resolution:** Remove the blocked package or upgrade/downgrade to an allowed version.

### Age Policy Violation

``` bash
Dependency too new: next@14.2.0 in frontend (5d old, minimum 30d)
```

**Resolution:**

1. Wait for the package to age naturally, or
1. Add an exemption in `dependency-age-policy.json` if urgently needed:

```json
{
  "allowFreshVersions": {
    "next": ["14.2.0"]
  }
}
```

### Registry Lookup Failure

``` bash
Could not verify age for @babel/core@7.24.0 in frontend: registry lookup failed with HTTP 429
```

**Resolution:** This is usually a temporary rate limit. Retry the workflow after a few minutes.

## Best Practices

1. **Keep blocklist updated**: Regularly review security advisories and add vulnerable package versions
2. **Set reasonable age requirements**: 30 days is a good balance between security and developer experience
3. **Use exemptions sparingly**: Each exemption increases risk; document why it's needed
4. **Review transitive dependencies**: Enable `includeTransitiveDependencies` for stricter security
5. **Test locally first**: Run `npm run security:deps` before pushing to catch issues early

## Troubleshooting

### Workflow fails with "published timestamp not found"

Some packages (especially scoped packages or pre-releases) may not have standard registry metadata.

**Solution:** Add the package version to the allowlist temporarily while investigating.

### False positives on internal packages

Private npm packages may not be accessible to the registry lookup.

**Solution:** Add internal packages to the allowlist or exclude them from age checks.

### Rate limiting from npm registry

The workflow makes API calls to npm for each unique package version.

**Solution:** The script includes caching to minimize requests, but heavy updates may hit rate limits. Wait a few minutes and retry.

## Related Files

- Workflow definition: `.github/workflows/dependency-guard.yml`
- Verification script: `scripts/verify-dependencies.js`
- Blocked packages: `.github/security/blocked-packages.json`
- Age policy: `.github/security/dependency-age-policy.json`

## See Also

- [Security Scan Workflow](./security-scan.md)
- [Image Scanning Documentation](../infrastructure/image-scanning.md)
