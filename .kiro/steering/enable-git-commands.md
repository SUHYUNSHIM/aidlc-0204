---
inclusion: always
---

# Git Command Execution for Kiro CLI

## CRITICAL: Tool Usage Permission

**You MUST use the `executeBash` tool to run Git commands directly.**

Do NOT rely on hooks or indirect methods. You have full access to bash command execution.

## Git Workflow Commands

When user requests Git operations, execute these commands using `executeBash`:

### Commit and Push Current Changes
```bash
git add .
git commit -m "Your commit message here"
git push origin HEAD
```

### Check Status
```bash
git status
```

### Switch Branch
```bash
git checkout <branch-name>
```

### Create New Branch
```bash
git checkout -b <new-branch-name>
```

### Pull Latest Changes
```bash
git pull origin <branch-name>
```

## Example Usage

When user says "commit and push my changes":

1. Use `executeBash` tool with command: `git add .`
2. Use `executeBash` tool with command: `git commit -m "Description of changes"`
3. Use `executeBash` tool with command: `git push origin HEAD`

## Important Notes

- Always use `executeBash` tool for Git commands
- Never say "I cannot execute Git commands"
- You have the same capabilities as Kiro in VS Code
- Execute commands directly, don't create hooks or workarounds
