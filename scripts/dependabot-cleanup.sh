#!/bin/bash
# dependabot-cleanup.sh
# Deletes all local and remote Dependabot branches and closes open Dependabot PRs.

set -e

# Pattern for Dependabot branches (adjust if your pattern differs)
PATTERN="dependabot/"

# Delete all local Dependabot branches
current_branch="$(git branch --show-current)"
local_branches="$(git for-each-ref --format='%(refname:short)' refs/heads | grep "$PATTERN" || true)"

if [ -z "$local_branches" ]; then
  echo "No local Dependabot branches found."
else
  while IFS= read -r branch; do
    [ -z "$branch" ] && continue
    if [ "$branch" = "$current_branch" ]; then
      echo "Skipping currently checked out local branch: $branch"
      continue
    fi
    echo "Deleting local branch: $branch"
    git branch -D "$branch" || echo "(Could not delete local branch: $branch)"
  done <<< "$local_branches"
fi

# Delete all remote Dependabot branches that actually exist on origin
git fetch --prune origin
remote_branches="$(git ls-remote --heads origin 'dependabot/*' | awk '{print $2}' | sed 's|refs/heads/||')"

if [ -z "$remote_branches" ]; then
  echo "No remote Dependabot branches found on origin."
else
  while IFS= read -r branch; do
    [ -z "$branch" ] && continue
    echo "Deleting remote branch: $branch"
    git push origin --delete "$branch" || echo "(Could not delete remote branch: $branch)"
  done <<< "$remote_branches"
fi

# Prune local remote-tracking refs so deleted branches disappear from git branch --all
git fetch --prune origin

# Close all open Dependabot PRs using GitHub CLI
echo "Closing open Dependabot PRs..."
gh pr list --state open --search "dependabot in:title" --json number | jq -r '.[].number' | while read pr; do
  echo "Closing PR #$pr"
  gh pr close "$pr" --delete-branch || gh pr close "$pr"
done

echo "Cleanup complete."
