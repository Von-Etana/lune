# GitHub Setup Instructions

Git is installed, but your current terminal doesn't see it yet. Please open a **New Terminal** (or restart VS Code) and run these exact commands:

```bash
# Initialize the repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Production Release: AI Proxy & Cert Minting"

# Rename branch to main
git branch -M main

# Connect your repository (https://github.com/Von-Etana/lune)
git remote add origin https://github.com/Von-Etana/lune.git

# Push code (you might need to log in)
git push -u origin main
```

## Troubleshooting
- If `git remote add` says "remote origin already exists":
  ```bash
  git remote set-url origin https://github.com/Von-Etana/lune.git
  git push -u origin main
  ```
- If you see authentication errors, use a **Personal Access Token** or GitHub Desktop.
