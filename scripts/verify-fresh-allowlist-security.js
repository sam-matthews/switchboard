#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const agePolicyPath = path.join(repoRoot, '.github', 'security', 'dependency-age-policy.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getAllowlistedPairs(policy) {
  const allowFresh = policy.allowFreshVersions || {};
  const pairs = [];

  for (const [name, versions] of Object.entries(allowFresh)) {
    if (!Array.isArray(versions)) {
      continue;
    }

    for (const version of versions) {
      if (typeof version === 'string' && version.trim() !== '') {
        pairs.push({ name, version: version.trim() });
      }
    }
  }

  return pairs;
}

function findAllowlistedInProject(projectDir, allowlistedPairs) {
  const lockPath = path.join(repoRoot, projectDir, 'package-lock.json');
  if (!fs.existsSync(lockPath)) {
    return [];
  }

  const lockJson = readJson(lockPath);
  const packages = lockJson.packages || {};
  const found = [];

  for (const pair of allowlistedPairs) {
    const lockEntry = packages[`node_modules/${pair.name}`];
    if (lockEntry && lockEntry.version === pair.version) {
      found.push(pair);
    }
  }

  return found;
}

async function fetchRegistryVersion(name, version) {
  const encodedName = encodeURIComponent(name).replace(/%40/g, '@');
  const url = `https://registry.npmjs.org/${encodedName}/${encodeURIComponent(version)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`registry lookup failed with HTTP ${response.status}`);
  }

  return response.json();
}

async function verifyRegistryMetadata(pairs) {
  const hits = [];

  for (const pair of pairs) {
    try {
      const body = await fetchRegistryVersion(pair.name, pair.version);
      const integrity = body.dist && body.dist.integrity;
      const tarball = body.dist && body.dist.tarball;

      if (!integrity || !integrity.startsWith('sha512-')) {
        hits.push(`Missing strong integrity hash for ${pair.name}@${pair.version}`);
      }

      if (!tarball || !tarball.startsWith('https://registry.npmjs.org/')) {
        hits.push(`Unexpected tarball host for ${pair.name}@${pair.version}: ${tarball || 'none'}`);
      }

      if (typeof body.deprecated === 'string' && body.deprecated.trim() !== '') {
        hits.push(`Package is deprecated: ${pair.name}@${pair.version} (${body.deprecated})`);
      }
    } catch (err) {
      hits.push(`Could not verify registry metadata for ${pair.name}@${pair.version}: ${err.message}`);
    }
  }

  return hits;
}

function runNpmAudit(projectDir) {
  const projectPath = path.join(repoRoot, projectDir);
  const output = execFileSync('npm', ['audit', '--omit=dev', '--json'], {
    cwd: projectPath,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return JSON.parse(output);
}

function verifyAuditForAllowlisted(projectDir, relevantPairs) {
  const hits = [];

  let audit;
  try {
    audit = runNpmAudit(projectDir);
  } catch (err) {
    const stderr = (err.stderr || '').trim();
    const stdout = (err.stdout || '').trim();
    const jsonText = stdout || stderr;

    if (!jsonText) {
      hits.push(`npm audit failed unexpectedly in ${projectDir}: ${err.message}`);
      return hits;
    }

    try {
      audit = JSON.parse(jsonText);
    } catch (parseErr) {
      hits.push(`npm audit output could not be parsed in ${projectDir}: ${parseErr.message}`);
      return hits;
    }
  }

  const vulnerabilities = audit.vulnerabilities || {};

  for (const pair of relevantPairs) {
    const vulnerability = vulnerabilities[pair.name];
    if (!vulnerability) {
      continue;
    }

    const severity = String(vulnerability.severity || '').toLowerCase();
    if (severity === 'high' || severity === 'critical') {
      hits.push(
        `High/Critical vulnerability on allowlisted package ${pair.name}@${pair.version} in ${projectDir} (severity: ${severity})`
      );
    }
  }

  return hits;
}

async function main() {
  const policy = readJson(agePolicyPath);
  const allowlistedPairs = getAllowlistedPairs(policy);

  if (allowlistedPairs.length === 0) {
    console.log('No allowFreshVersions entries found. Skipping fresh dependency security checks.');
    return;
  }

  const projectDirs = ['backend', 'frontend'];
  const projectMatches = new Map();

  for (const projectDir of projectDirs) {
    projectMatches.set(projectDir, findAllowlistedInProject(projectDir, allowlistedPairs));
  }

  const allFound = [...projectMatches.values()].flat();
  const missing = allowlistedPairs.filter(
    (pair) => !allFound.some((found) => found.name === pair.name && found.version === pair.version)
  );

  const hits = [];

  for (const pair of missing) {
    hits.push(`Allowlisted dependency not present in lockfiles: ${pair.name}@${pair.version}`);
  }

  hits.push(...(await verifyRegistryMetadata(allowlistedPairs)));

  for (const [projectDir, relevantPairs] of projectMatches.entries()) {
    if (relevantPairs.length === 0) {
      continue;
    }

    hits.push(...verifyAuditForAllowlisted(projectDir, relevantPairs));
  }

  if (hits.length > 0) {
    console.error('Fresh-allowlist security check violation(s):');
    for (const hit of hits) {
      console.error(`- ${hit}`);
    }
    process.exit(1);
  }

  console.log('Fresh-allowlist security checks passed.');
}

main().catch((err) => {
  console.error(`Fresh-allowlist security checks failed unexpectedly: ${err.message}`);
  process.exit(1);
});
