# Setting Up Automated Deployment (GitHub Actions)

This guide explains how to set up automatic deployment so that every time you push code to GitHub, it automatically deploys to your live Hostinger website.

## 🎯 What This Does

Once set up, every time you:
1. Make changes to your code
2. Push to GitHub (`git push origin main`)

Your website will **automatically update** on Hostinger! No manual upload needed.

---

## ⚠️ Prerequisites

- GitHub repository access
- Hostinger FTP credentials
- Supabase credentials (for environment variables)

---

## Step 1: Get Hostinger FTP Credentials

1. **Log in to Hostinger hPanel**: https://hpanel.hostinger.com
2. Go to **Hosting** → **Manage**
3. Click on **FTP Accounts**
4. Note down:
   - **FTP Host** (e.g., `ftp.yourdomain.com` or an IP address)
   - **FTP Username**
   - **FTP Password**
   - **Remote Directory** (usually `/public_html`)

**If you don't have FTP account:**
- Create one in Hostinger hPanel → FTP Accounts → Create FTP Account

---

## Step 2: Add GitHub Secrets

GitHub Secrets store sensitive information securely. They're encrypted and only used during deployment.

1. **Go to your GitHub repository**: 
   - https://github.com/Isaacdev2004/ShonenCloud-project

2. **Navigate to Secrets**:
   - Click **Settings** (top menu)
   - Click **Secrets and variables** → **Actions** (left sidebar)

3. **Add secrets one by one**:
   - Click **New repository secret** for each one

### Required Secrets:

#### FTP Credentials

**FTP_HOST**
- Name: `FTP_HOST`
- Value: Your FTP host from Hostinger (e.g., `ftp.yourdomain.com`)

**FTP_USERNAME**
- Name: `FTP_USERNAME`
- Value: Your FTP username

**FTP_PASSWORD**
- Name: `FTP_PASSWORD`
- Value: Your FTP password

**FTP_REMOTE_DIR**
- Name: `FTP_REMOTE_DIR`
- Value: `/public_html` (or your remote directory path)

#### Supabase Credentials

**VITE_SUPABASE_URL**
- Name: `VITE_SUPABASE_URL`
- Value: Your Supabase project URL
- Find it in: Supabase Dashboard → Settings → API → Project URL

**VITE_SUPABASE_PUBLISHABLE_KEY**
- Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
- Value: Your Supabase anon/public key
- Find it in: Supabase Dashboard → Settings → API → anon public key

---

## Step 3: Verify GitHub Actions Workflow

The workflow file (`.github/workflows/deploy.yml`) should already exist in the repository.

**To verify:**
1. Go to your repository on GitHub
2. Check if `.github/workflows/deploy.yml` exists
3. If it doesn't exist, it will be created automatically when you push code

**The workflow triggers on:**
- Push to `main` branch
- Automatically builds and deploys

---

## Step 4: Test Automated Deployment

1. **Make a small test change**:
   - Edit any file (e.g., add a comment)
   - Or change some text in `src/pages/Index.tsx`

2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Test automated deployment"
   git push origin main
   ```

3. **Check GitHub Actions**:
   - Go to your repository on GitHub
   - Click **Actions** tab (top menu)
   - You should see a workflow running called "Deploy to Hostinger"
   - Wait for it to complete (usually 2-5 minutes)
   - ✅ Green checkmark = Success
   - ❌ Red X = Failed (check logs)

4. **Verify on live site**:
   - Visit your website: `http://shonencloud.com`
   - Your changes should be live!
   - Clear cache if needed: `Ctrl + F5`

---

## How It Works

### The Deployment Process:

1. **You push code** to GitHub (`main` branch)
2. **GitHub Actions triggers** automatically
3. **Workflow runs**:
   - ✅ Checks out your code
   - ✅ Installs Node.js
   - ✅ Installs dependencies (`npm install`)
   - ✅ Builds the project (`npm run build`)
   - ✅ Deploys via FTP to Hostinger
4. **Your site updates** automatically!

### Timeline:
- **Push to GitHub**: ~10 seconds
- **GitHub Actions runs**: ~2-5 minutes
- **FTP upload**: ~1-2 minutes
- **Total time**: ~3-7 minutes from push to live site

---

## Troubleshooting

### Workflow Fails

**Check GitHub Actions logs:**
1. Go to repository → **Actions** tab
2. Click on the failed workflow (red X)
3. Click on the failed job
4. Expand the failed step to see error messages

**Common issues:**

**FTP connection failed**
- Verify FTP credentials are correct
- Check FTP host is accessible
- Ensure FTP account is active in Hostinger

**Build failed**
- Check for syntax errors in your code
- Verify all dependencies are in `package.json`
- Check error messages in the build step

**Missing secrets**
- Ensure all 6 secrets are added
- Double-check secret names match exactly (case-sensitive)
- Verify values are correct

**Permission denied**
- Check FTP username and password
- Verify FTP account has write permissions
- Ensure remote directory path is correct

### Changes Not Deploying

**Check these:**
- ✅ Workflow completed successfully (green checkmark)
- ✅ You pushed to `main` branch (not another branch)
- ✅ Wait a few minutes for FTP upload to complete
- ✅ Clear browser cache (Ctrl+F5)
- ✅ Check File Manager to verify files were uploaded

### Workflow Not Triggering

**Possible reasons:**
- You pushed to a different branch (workflow only runs on `main`)
- Workflow file doesn't exist (should be `.github/workflows/deploy.yml`)
- GitHub Actions might be disabled (check repository settings)

---

## Customizing the Workflow

### Deploy from Different Branch

Edit `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches: [ main, develop ]  # Add your branch here
```

### Deploy on Schedule

Add to `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # Deploy daily at midnight
```

### Deploy Manually

Add to `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches: [ main ]
  workflow_dispatch:  # Allows manual trigger
```

Then you can trigger it from Actions tab → "Run workflow"

---

## Disable Automated Deployment

If you want to deploy manually only:

**Option 1: Disable workflow**
1. Go to repository → **Settings** → **Actions**
2. Under "Workflow permissions", disable workflows

**Option 2: Delete workflow file**
1. Delete `.github/workflows/deploy.yml` file
2. Push the change

**Option 3: Keep but don't use**
- Just don't push to `main` branch
- Use a different branch for development

---

## Manual Override

Even with automated deployment, you can still deploy manually:

1. **Build locally**: `npm run build`
2. **Upload `dist` folder** to Hostinger
3. **Done!**

Manual deployment is useful for:
- Quick fixes
- Testing before automated deployment
- When automated deployment fails

---

## Security Notes

✅ **GitHub Secrets are secure:**
- Encrypted at rest
- Only visible to repository collaborators
- Never shown in logs
- Can't be accessed by others

✅ **Best practices:**
- Never commit `.env` files or passwords
- Use separate FTP user with limited permissions if possible
- Regularly rotate FTP passwords
- Only give repository access to trusted people

---

## Monitoring Deployments

**Check deployment status:**
- Go to repository → **Actions** tab
- See all recent deployments
- Click on any deployment to see details
- Check logs if deployment failed

**Get notifications:**
- GitHub will email you if deployment fails
- You can set up additional notifications in repository settings

---

## Summary

**Once set up:**
1. Make changes to code
2. Push to GitHub: `git push origin main`
3. Wait 3-7 minutes
4. Changes are live on your website! 🚀

**No more manual uploads needed!**

---

## Need Help?

- Check workflow logs in GitHub Actions tab
- Verify all secrets are set correctly
- Test FTP connection manually
- Contact your developer for assistance

---

**Happy automated deploying! 🎉**

