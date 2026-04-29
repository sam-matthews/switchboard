# SBOM Generation and Validation

This document outlines the process for generating and validating Software
Bill of Materials (SBOMs) for the project.

## Overview

We use a combination of Syft and Trivy to generate and scan SBOMs for our
frontend and backend services. The process is automated via a GitHub Actions
workflow.

- **Syft**: Used to generate SBOMs from our Docker images in CycloneDX JSON format.
- **Trivy**: Used to scan the generated SBOMs for vulnerabilities.

## Workflow

The SBOM generation and scanning process is defined in the
[`/.github/workflows/sbom.yml`](/.github/workflows/sbom.yml) GitHub Actions
workflow. The workflow is triggered on pushes to the `integration` branch and
pull requests to `main`.

The workflow performs the following steps:

1. **Build Docker Images**: Builds the `frontend` and `backend` Docker images
   using `docker-compose`.
2. **Generate SBOMs**: Uses Syft to generate SBOMs for the `frontend` and
   `backend` images. The SBOMs are generated in CycloneDX JSON format.
3. **Scan for Vulnerabilities**: Uses Trivy to scan the repository for
   vulnerabilities. The results are uploaded to the GitHub Security tab.
4. **Upload Artifacts**: The generated SBOMs are uploaded as build artifacts
   for inspection and record-keeping.

## Storing SBOMs

Generated SBOMs are stored in the `.sbom/` directory. This directory is
version-controlled to maintain a history of SBOMs for each release.
