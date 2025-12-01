# Instructions for Editing and Updating Your Website

## Overview

You can now edit the code yourself and deploy changes to your live website. This document explains the complete process.

**Repository**: https://github.com/Isaacdev2004/ShonenCloud-project

---

## What You Need to Know

### The Process
1. **Edit code** on your computer
2. **Test changes** locally
3. **Save to GitHub** (version control)
4. **Build for production**
5. **Upload to Hostinger** (make it live)

### Required Software
- **Node.js** (for building the project) - https://nodejs.org/
- **Git** (for version control) - https://git-scm.com/
- **Code Editor** (VS Code recommended) - https://code.visualstudio.com/

---

## First Time Setup

### 1. Install Required Software

**Node.js**:
- Download from https://nodejs.org/ (choose LTS version)
- Run installer
- Verify: Open Command Prompt, type `node --version` (should show version number)

**Git**:
- Usually installed with Node.js
- If not, download from https://git-scm.com/
- Verify: Type `git --version` in Command Prompt

**Visual Studio Code**:
- Download from https://code.visualstudio.com/
- Free code editor with helpful features

### 2. Get the Code on Your Computer

1. **Open Command Prompt** (Windows) or Terminal (Mac)
2. **Navigate to where you want the project**:
   ```bash
   cd Desktop
   ```
3. **Clone the repository**:
   ```bash
   git clone https://github.com/Isaacdev2004/ShonenCloud-project.git
   ```
4. **Enter the project folder**:
   ```bash
   cd ShonenCloud-project
   cd shonen-unity-project-main
   ```
5. **Install dependencies**:
   ```bash
   npm install
   ```
   (This takes a few minutes the first time)

### 3. Set Up Environment Variables

1. **Create a `.env` file** in the project root folder
2. **Add your Supabase credentials**:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   ```
   *(Contact the developer for these values if you don't have them)*

### 4. Test Your Setup

```bash
npm run dev
```

- Open http://localhost:8080 in your browser
- You should see your website
- Press `Ctrl+C` to stop

---

## Making Changes and Deploying

### Complete Workflow (Every Time You Make Changes)

#### Step 1: Make Your Changes
1. Open the project folder in **Visual Studio Code**
2. Navigate to files you want to edit:
   - **Pages**: `src/pages/` folder
   - **Components**: `src/components/` folder
   - **Images**: `src/assets/` folder
3. Make your edits
4. Save files (Ctrl+S)

#### Step 2: Test Locally
```bash
npm run dev
```
- View at http://localhost:8080
- Check everything works
- Fix any issues
- Press `Ctrl+C` when done testing

#### Step 3: Save to GitHub
```bash
git add .
git commit -m "Description of your changes"
git push origin main
```
- Example: `git commit -m "Updated homepage text"`
- You may need GitHub credentials (use Personal Access Token if prompted)

#### Step 4: Build for Production
```bash
npm run build
```
- This creates a `dist` folder
- Wait for completion (1-2 minutes)

#### Step 5: Upload to Hostinger
1. **Log in to Hostinger**: https://hpanel.hostinger.com
2. **Go to File Manager** → `public_html`
3. **Delete old files** (or backup first)
4. **Upload all contents** from the `dist` folder
5. **Upload `.htaccess`** file to root
6. **Visit your site**: http://shonencloud.com
7. **Hard refresh**: Press `Ctrl+F5` to see changes

---

## Project Structure Guide

```
shonen-unity-project-main/
├── src/
│   ├── pages/          ← Edit your pages here
│   │   ├── Index.tsx   ← Homepage
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── components/     ← Reusable components
│   ├── assets/         ← Images and media
│   └── ...
├── public/             ← Static files
├── index.html          ← Main HTML
└── package.json        ← Project config
```

---

## Common Tasks

### Change Text Content
1. Open the page file in `src/pages/`
2. Find the text you want to change
3. Edit and save
4. Follow deployment workflow above

### Replace Images
1. Replace image file in `src/assets/`
2. Keep same filename, OR
3. Update image path in the code
4. Follow deployment workflow

### Add New Content
1. Edit the appropriate page file
2. Add your content using React/JSX syntax
3. Test locally first
4. Follow deployment workflow

---

## Important Notes

### ⚠️ Before Making Changes
- **Always test locally first** with `npm run dev`
- **Backup current site** by downloading `dist` folder from Hostinger
- **Commit often** with clear messages

### 🔒 Security
- **Never commit `.env` file** to GitHub (it's in .gitignore)
- **Keep Supabase credentials secure**
- **Don't share your GitHub token**

### 🚀 Deployment Tips
- **Build after every change** before uploading
- **Clear browser cache** (Ctrl+F5) after deployment
- **Test thoroughly** on live site after each update

---

## Troubleshooting

### "npm: command not found"
→ Install Node.js from https://nodejs.org/

### "git: command not found"
→ Install Git from https://git-scm.com/

### Changes not showing on live site
→ Make sure you:
1. Ran `npm run build`
2. Uploaded new `dist` folder
3. Cleared browser cache (Ctrl+F5)

### Build fails
→ Check for:
- Syntax errors in code
- Missing `.env` file
- Run `npm install` again

### Can't push to GitHub
→ Use Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` scope
3. Use token as password when Git asks

---

## Getting Help

If you encounter issues:

1. **Check error messages** carefully
2. **Search online** for the specific error
3. **Contact support** with:
   - What you were trying to do
   - Exact error message
   - Screenshots

---

## Quick Command Reference

```bash
# Start local development server
npm run dev

# Build for production
npm run build

# Save changes to GitHub
git add .
git commit -m "Your message"
git push origin main

# Check what files changed
git status
```

---

## Summary

**To update your website:**
1. Edit code → 2. Test locally → 3. Push to GitHub → 4. Build → 5. Upload to Hostinger

**Your changes will be live!** 🎉

For detailed instructions, see `CLIENT_EDITING_GUIDE.md` in the repository.

