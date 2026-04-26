#!/bin/bash
# Script to validate and trigger CodeQL workflow
# This script validates the workflow syntax and provides options to trigger it on GitHub

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKFLOW_FILE="$PROJECT_ROOT/.github/workflows/codeql.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "CodeQL Workflow Validation and Trigger Script"
echo "================================================"
echo ""

# Function to validate YAML syntax
validate_yaml_syntax() {
  echo "📋 Validating YAML syntax..."
  
  # Check if yq is installed (for YAML validation)
  if command -v yq &> /dev/null; then
    if yq eval '.' "$WORKFLOW_FILE" > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} YAML syntax is valid"
      return 0
    else
      echo -e "${RED}✗${NC} YAML syntax is invalid"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠${NC} yq not installed, skipping YAML validation"
    echo "  Install with: brew install yq (macOS)"
  fi
}

# Function to check workflow structure
check_workflow_structure() {
  echo ""
  echo "🔍 Checking workflow structure..."
  
  # Check for required fields
  if grep -q "name:" "$WORKFLOW_FILE"; then
    echo -e "${GREEN}✓${NC} Workflow name is defined"
  else
    echo -e "${RED}✗${NC} Workflow name is missing"
  fi
  
  if grep -q "on:" "$WORKFLOW_FILE" || grep -q "^on$" "$WORKFLOW_FILE"; then
    echo -e "${GREEN}✓${NC} Workflow triggers are defined"
  else
    echo -e "${RED}✗${NC} Workflow triggers are missing"
  fi
  
  if grep -q "jobs:" "$WORKFLOW_FILE"; then
    echo -e "${GREEN}✓${NC} Jobs are defined"
  else
    echo -e "${RED}✗${NC} Jobs are missing"
  fi
  
  # Check for security permissions
  if grep -q "security-events: write" "$WORKFLOW_FILE"; then
    echo -e "${GREEN}✓${NC} Security events permission is set"
  else
    echo -e "${YELLOW}⚠${NC} Security events permission may be missing"
  fi
}

# Function to check for actionlint
check_actionlint() {
  echo ""
  echo "🔨 Checking with actionlint..."
  
  if command -v actionlint &> /dev/null; then
    if actionlint "$WORKFLOW_FILE"; then
      echo -e "${GREEN}✓${NC} No issues found by actionlint"
      return 0
    else
      echo -e "${RED}✗${NC} actionlint found issues"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠${NC} actionlint not installed"
    echo "  Install with: brew install actionlint (macOS)"
  fi
}

# Function to trigger workflow on GitHub
trigger_workflow() {
  echo ""
  echo "🚀 Triggering CodeQL workflow on GitHub..."
  
  if ! command -v gh &> /dev/null; then
    echo -e "${RED}✗${NC} GitHub CLI (gh) is not installed"
    echo "  Install with: brew install gh (macOS)"
    return 1
  fi
  
  # Check if authenticated
  if ! gh auth status > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} Not authenticated with GitHub CLI"
    echo "  Run: gh auth login"
    return 1
  fi
  
  echo "  Triggering workflow_dispatch event..."
  if gh workflow run codeql.yml; then
    echo -e "${GREEN}✓${NC} Workflow triggered successfully!"
    echo ""
    echo "  View workflow runs:"
    echo "  $ gh workflow view codeql.yml"
    echo ""
    echo "  Watch the latest run:"
    echo "  $ gh run watch"
  else
    echo -e "${RED}✗${NC} Failed to trigger workflow"
    return 1
  fi
}

# Main execution
cd "$PROJECT_ROOT"

# Validate workflow
validate_yaml_syntax
check_workflow_structure
check_actionlint

echo ""
echo "================================================"
echo ""

# Ask if user wants to trigger the workflow
read -p "Do you want to trigger the workflow on GitHub? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  trigger_workflow
else
  echo "Skipping workflow trigger."
  echo ""
  echo "To trigger manually, run:"
  echo "  gh workflow run codeql.yml"
fi

echo ""
echo "Done!"
