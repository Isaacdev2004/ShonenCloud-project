# Client Workflow Guide: Making Changes & Deploying to Live Site

This guide explains how to make code changes and deploy them to your live website on Hostinger.

---

## 📋 Table of Contents

1. [Setting Up Your Development Environment](#setting-up)
2. [Making Changes](#making-changes)
3. [Deploying Changes to Live Site](#deploying-changes)
4. [Automated Deployment (Optional)](#automated-deployment)

---

## 🚀 Setting Up Your Development Environment

### Step 1: Install Required Software

1. **Install Node.js** (if not already installed):
   - Download from: https://nodejs.org/
   - Install the LTS version (recommended)
   - Verify installation: Open terminal/command prompt and run `node --version`

2. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/downloads
   - Verify installation: Run `git --version`

3. **Choose a Code Editor** (optional but recommended):
   - VS Code: https://code.visualstudio.com/ (Free, recommended)
   - Or any editor you prefer

### Step 2: Clone the Repository

1. **Get the repository URL**:
   - Repository: https://github.com/Isaacdev2004/ShonenCloud-project
   - Click the green "Code" button
   - Copy the HTTPS URL

2. **Clone the repository**:
   ```bash
   # Open terminal/command prompt
   git clone https://github.com/Isaacdev2004/ShonenCloud-project.git
   cd ShonenCloud-project
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   - Create a `.env` file in the project root (same folder as `package.json`)
   - Add your Supabase credentials:
     ```env
     VITE_SUPABASE_URL=your_supabase_url_here
     VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key_here
     ```
   - **Important**: Never commit `.env` file to Git! It's already in `.gitignore`

### Step 3: Test Locally

```bash
# Start development server
npm run dev
```

Visit `http://localhost:8080` to see your site running locally.

---

## ✏️ Making Changes

### Workflow Overview

1. **Make your code changes**
2. **Test locally** with `npm run dev`
3. **Build for production** with `npm run build`
4. **Deploy to Hostinger**
5. **Commit and push to GitHub** (to save your changes)

### Step-by-Step: Making Changes

#### 1. Make Your Code Changes

- Open files in your code editor
- Edit files in the `src/` directory
- Common files to edit:
  - `src/pages/Index.tsx` - Homepage
  - `src/pages/Dashboard.tsx` - Dashboard page
  - `src/components/` - Reusable components
  - `src/App.tsx` - Main app component

#### 2. Test Your Changes Locally

```bash
# Make sure you're in the project directory
npm run dev
```

- Visit `http://localhost:8080`
- Verify your changes work as expected
- Fix any issues before deploying

#### 3. Build for Production

```bash
npm run build
```

This creates a `dist` folder with production-ready files.

#### 4. Deploy to Hostinger

**Option A: Using File Manager (Easier)**

1. **Log in to Hostinger**:
   - Go to https://hpanel.hostinger.com
   - Navigate to **File Manager** → `public_html`

2. **Upload files**:
   - Delete old files in `public_html` (except `.htaccess` if you want to keep it)
   - Upload **all files** from the `dist` folder
   - Upload `.htaccess` file to root (if not already there)

3. **Verify deployment**:
   - Visit your website: `http://shonencloud.com`
   - Clear browser cache: Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
   - Test your changes

**Option B: Using FTP (Faster for large files)**

1. **Get FTP credentials**:
   - In Hostinger hPanel → Hosting → Manage
   - Go to "FTP Accounts"
   - Note: FTP Host, Username, Password

2. **Use FTP client** (FileZilla, WinSCP, etc.):
   - Connect using your FTP credentials
   - Navigate to `public_html`
   - Upload all files from `dist` folder
   - Upload `.htaccess` file

#### 5. Save Changes to GitHub (Recommended)

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "Description of your changes"
# Example: git commit -m "Updated homepage text and colors"

# Push to GitHub
git push origin main
```

**Note**: If you don't have write access, you may need to:
- Fork the repository, or
- Ask the repository owner for access

---

## 🚀 Deploying Changes to Live Site

### Quick Deployment Steps

1. **Build**: `npm run build`
2. **Upload**: Upload `dist` folder contents to Hostinger `public_html`
3. **Test**: Visit your website and verify changes

### Detailed Deployment Process

#### Method 1: Manual Deployment (Recommended for Beginners)

**Every time you make changes:**

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload to Hostinger**:
   - Log in to Hostinger hPanel
   - Go to File Manager → `public_html`
   - Delete old files (or backup first)
   - Upload all files from `dist` folder
   - Upload `.htaccess` file

3. **Clear cache and test**:
   - Clear browser cache (Ctrl+F5)
   - Visit your website
   - Verify changes are live

#### Method 2: Automated Deployment (Advanced)

Set up once, then every push to GitHub automatically deploys! See `AUTOMATED_DEPLOYMENT_SETUP.md` for setup instructions.

---

## 📝 Quick Reference: Common Tasks

### Making a Small Text Change

```bash
# 1. Edit the file (e.g., src/pages/Index.tsx)
# 2. Test locally
npm run dev

# 3. Build
npm run build

# 4. Upload dist folder to Hostinger
# 5. Done!
```

### Adding a New Feature

```bash
# 1. Make changes in your code
# 2. Test locally: npm run dev
# 3. Build: npm run build
# 4. Upload to Hostinger
# 5. Commit to GitHub (optional)
git add .
git commit -m "Added new feature"
git push origin main
```

### Updating Dependencies

```bash
# 1. Update package.json or run:
npm update

# 2. Test locally
npm run dev

# 3. Build and deploy
npm run build
# Upload to Hostinger
```

---

## ⚠️ Important Notes

1. **Always test locally first**: Run `npm run dev` before deploying
2. **Environment variables**: Make sure `.env` file has correct Supabase credentials before building
3. **Build before deploy**: Always run `npm run build` before uploading
4. **Backup**: Consider backing up current site before major changes
5. **Git workflow**: Commit and push to GitHub to keep history of changes

---

## 🆘 Troubleshooting

### Build Fails
- **Check for syntax errors** in your code
- **Verify dependencies**: Run `npm install`
- **Check `.env` file**: Ensure it exists and has correct values
- **Check error messages**: They usually tell you what's wrong

### Changes Not Showing on Live Site
- **Clear browser cache**: Press `Ctrl + F5` or `Cmd + Shift + R`
- **Verify files uploaded**: Check File Manager to ensure files are there
- **Check browser console**: Press F12 → Console tab for errors
- **Ensure you built**: Run `npm run build` before uploading

### Git Push Fails
- **Check authentication**: Make sure you're logged into GitHub
- **Verify access**: Ensure you have write access to the repository
- **Check commits**: Run `git status` to see what needs to be committed

### Local Server Won't Start
- **Check port**: Make sure port 8080 is not in use
- **Reinstall dependencies**: Run `npm install` again
- **Check Node.js version**: Should be Node.js 18 or higher

---

## 📚 Additional Resources

- **Git Basics**: https://git-scm.com/doc
- **GitHub Guide**: https://guides.github.com/
- **Node.js Docs**: https://nodejs.org/docs/
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/

---

## 🎯 Summary: Quick Workflow

**Every time you want to make changes:**

1. **Make changes** → Edit code files
2. **Test locally** → `npm run dev` (visit http://localhost:8080)
3. **Build** → `npm run build`
4. **Deploy** → Upload `dist` folder to Hostinger
5. **Save to GitHub** → `git add .` → `git commit -m "message"` → `git push`
6. **Verify** → Visit your website and test

**That's it! Your changes are now live! 🎉**

---

## Need Help?

- Check other guides in this repository:
  - `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
  - `AUTOMATED_DEPLOYMENT_SETUP.md` - Set up automatic deployment
  - `TROUBLESHOOTING.md` - Common issues and solutions

- Contact your developer if you need assistance

