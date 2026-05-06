# 🔐 GitHub Push Instructions

## Issue
Authentication error: Permission denied to push to `iitrsquad/roorq3`

## Solutions

### Option 1: Use Personal Access Token (Recommended)

1. **Create a Personal Access Token**:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name it: "Roorq Deployment"
   - Select scopes: `repo` (full control of private repositories)
   - Generate and **copy the token** (you won't see it again!)

2. **Update Git Remote with Token**:
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/iitrsquad/roorq3.git
   ```

   Or use your username:
   ```bash
   git remote set-url origin https://iitrsquad:YOUR_TOKEN@github.com/iitrsquad/roorq3.git
   ```

3. **Push**:
   ```bash
   git push --set-upstream origin main
   ```

### Option 2: Use SSH (More Secure)

1. **Check if you have SSH key**:
   ```bash
   ls ~/.ssh/id_rsa.pub
   ```

2. **If no SSH key, generate one**:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

3. **Add SSH key to GitHub**:
   - Copy public key: `cat ~/.ssh/id_rsa.pub`
   - Go to GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste the key and save

4. **Update remote to use SSH**:
   ```bash
   git remote set-url origin git@github.com:iitrsquad/roorq3.git
   ```

5. **Push**:
   ```bash
   git push --set-upstream origin main
   ```

### Option 3: Clear Windows Credentials

1. **Open Windows Credential Manager**:
   - Press `Win + R`
   - Type: `control /name Microsoft.CredentialManager`
   - Or search "Credential Manager" in Start menu

2. **Remove GitHub credentials**:
   - Go to "Windows Credentials"
   - Find entries for `github.com`
   - Remove them

3. **Try pushing again** (will prompt for credentials):
   ```bash
   git push --set-upstream origin main
   ```

### Option 4: Use GitHub CLI

1. **Install GitHub CLI** (if not installed):
   ```bash
   winget install GitHub.cli
   ```

2. **Login**:
   ```bash
   gh auth login
   ```

3. **Push**:
   ```bash
   git push --set-upstream origin main
   ```

## Quick Fix (If you have access to iitrsquad account)

If you have the password or token for the `iitrsquad` GitHub account:

```bash
git push --set-upstream origin main
```

When prompted, enter:
- Username: `iitrsquad`
- Password: Use a Personal Access Token (not your password)

## Verify Access

Make sure you have:
- ✅ Write access to `iitrsquad/roorq3` repository
- ✅ Correct GitHub account authenticated
- ✅ Repository exists and is not empty (or allow force push if needed)

