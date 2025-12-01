# Guide for Editing and Updating Your Website

This guide will help you make changes to your ShonenCloud website code and deploy those changes to your live site.

---

## Prerequisites

Before you start, you'll need:

1. **GitHub Account** - You should already have access to the repository
2. **Node.js Installed** - Download from https://nodejs.org/ (LTS version)
3. **Git Installed** - Usually comes with Node.js, or download from https://git-scm.com/
4. **Code Editor** - Recommended: Visual Studio Code (free) from https://code.visualstudio.com/
5. **Hostinger Access** - Your hosting account credentials

---

## Part 1: Setting Up Your Local Development Environment

### Step 1: Install Required Software

1. **Install Node.js**:
   - Go to https://nodejs.org/
   - Download the LTS version
   - Run the installer
   - Verify installation by opening Command Prompt/Terminal and typing:
     ```bash
     node --version
     npm --version
     ```
   - You should see version numbers

2. **Install Git** (if not already installed):
   - Go to https://git-scm.com/
   - Download and install
   - Verify installation:
     ```bash
     git --version
     ```

3. **Install Visual Studio Code** (recommended editor):
   - Go to https://code.visualstudio.com/
   - Download and install

### Step 2: Clone the Repository

1. **Get the Repository URL**:
   - Go to https://github.com/Isaacdev2004/ShonenCloud-project
   - Click the green "Code" button
   - Copy the HTTPS URL (e.g., `https://github.com/Isaacdev2004/ShonenCloud-project.git`)

2. **Clone to Your Computer**:
   - Open Command Prompt (Windows) or Terminal (Mac/Linux)
   - Navigate to where you want to save the project:
     ```bash
     cd Desktop
     # or
     cd Documents
     ```
   - Clone the repository:
     ```bash
     git clone https://github.com/Isaacdev2004/ShonenCloud-project.git
     ```
   - Navigate into the project:
     ```bash
     cd ShonenCloud-project
     cd shonen-unity-project-main
     ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```
   - This will take a few minutes the first time
   - Wait for it to complete

### Step 3: Set Up Environment Variables

1. **Create `.env` file**:
   - In the project folder, create a file named `.env`
   - Add your Supabase credentials:
     ```env
     VITE_SUPABASE_URL=your_supabase_url_here
     VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key_here
     ```
   - **Important**: Get these values from your Supabase dashboard (Settings → API)

2. **Test Your Setup**:
   ```bash
   npm run dev
   ```
   - This starts a local development server
   - Open http://localhost:8080 in your browser
   - You should see your website running locally
   - Press `Ctrl+C` to stop the server

---

## Part 2: Making Changes to Your Code

### Step 1: Open the Project in Your Editor

1. **Open Visual Studio Code**
2. **File → Open Folder**
3. **Select the project folder** (`ShonenCloud-project/shonen-unity-project-main`)

### Step 2: Understanding the Project Structure

```
shonen-unity-project-main/
├── src/
│   ├── pages/          # All your website pages
│   ├── components/      # Reusable components
│   ├── assets/          # Images and media files
│   └── ...
├── public/              # Static files
├── index.html           # Main HTML file
└── package.json         # Project configuration
```

### Step 3: Making Your Changes

**Common edits you might want to make:**

1. **Edit Text Content**:
   - Open files in `src/pages/` folder
   - Find the text you want to change
   - Edit and save (Ctrl+S)

2. **Change Images**:
   - Replace images in `src/assets/` folder
   - Keep the same filename, or update references in code

3. **Modify Styling**:
   - Most styling is in component files (`.tsx` files)
   - Look for `className` attributes or Tailwind CSS classes

4. **Add New Pages**:
   - Create new files in `src/pages/`
   - Add routes in `src/App.tsx`

### Step 4: Test Your Changes Locally

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **View your changes**:
   - Open http://localhost:8080
   - Your changes should be visible
   - The page auto-refreshes when you save files

3. **Test thoroughly**:
   - Click through all pages
   - Test all features
   - Make sure nothing is broken

---

## Part 3: Pushing Changes to GitHub

### Step 1: Save Your Changes with Git

1. **Check what files changed**:
   ```bash
   git status
   ```
   - This shows all modified files

2. **Add your changes**:
   ```bash
   git add .
   ```
   - This stages all your changes

3. **Commit your changes**:
   ```bash
   git commit -m "Description of your changes"
   ```
   - Example: `git commit -m "Updated homepage text and images"`

4. **Push to GitHub**:
   ```bash
   git push origin main
   ```
   - You may need to enter your GitHub credentials
   - If asked for password, use a Personal Access Token (not your GitHub password)

### Step 2: Create a Personal Access Token (If Needed)

If Git asks for authentication:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Give it a name (e.g., "Local Development")
4. Select scope: `repo` (full control)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)
7. Use this token as your password when Git asks

---

## Part 4: Deploying Changes to Your Live Website

After pushing to GitHub, you need to deploy to Hostinger:

### Step 1: Build Your Project for Production

1. **Make sure you're in the project folder**:
   ```bash
   cd ShonenCloud-project/shonen-unity-project-main
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```
   - This creates a `dist` folder with production-ready files
   - Wait for it to complete (may take 1-2 minutes)

3. **Verify the build**:
   - Check that `dist` folder was created
   - It should contain `index.html`, `assets` folder, etc.

### Step 2: Upload to Hostinger

1. **Log in to Hostinger**:
   - Go to https://hpanel.hostinger.com
   - Navigate to File Manager
   - Open `public_html` folder

2. **Delete Old Files** (optional but recommended):
   - Select all files in `public_html`
   - Delete them (keep `.htaccess` if you want)

3. **Upload New Files**:
   - Upload ALL contents from the `dist` folder
   - Upload the `.htaccess` file to the root
   - **Important**: Upload the files INSIDE `dist`, not the `dist` folder itself

4. **Verify Upload**:
   - Check that `index.html` is in `public_html` root
   - Check that `assets` folder exists
   - Check that `.htaccess` is present

### Step 3: Test Your Live Site

1. **Visit your website**: http://shonencloud.com
2. **Hard refresh**: Press `Ctrl+F5` to clear cache
3. **Verify your changes are live**
4. **Test all functionality**

---

## Quick Reference: Complete Workflow

Here's the complete process every time you make changes:

```bash
# 1. Make your code changes in the editor

# 2. Test locally
npm run dev
# View at http://localhost:8080

# 3. Save to GitHub
git add .
git commit -m "Your change description"
git push origin main

# 4. Build for production
npm run build

# 5. Upload dist folder contents to Hostinger public_html

# 6. Test live site
```

---

## Troubleshooting

### Issue: "npm: command not found"
**Solution**: Node.js is not installed or not in PATH. Reinstall Node.js.

### Issue: "git: command not found"
**Solution**: Git is not installed. Install from https://git-scm.com/

### Issue: Changes not showing on live site
**Solution**: 
- Make sure you ran `npm run build` after making changes
- Clear browser cache (Ctrl+F5)
- Verify files were uploaded to Hostinger correctly

### Issue: "Permission denied" when pushing to GitHub
**Solution**: 
- Use Personal Access Token instead of password
- Or set up SSH keys for GitHub

### Issue: Build fails
**Solution**:
- Check for syntax errors in your code
- Make sure `.env` file has correct values
- Run `npm install` again

---

## Best Practices

1. **Always test locally first** before deploying
2. **Commit often** with descriptive messages
3. **Keep `.env` file secure** - never commit it to GitHub
4. **Backup before major changes** - download current `dist` folder
5. **Test on live site** after every deployment

---

## Getting Help

If you encounter issues:

1. **Check error messages** in the terminal/console
2. **Search for the error** online
3. **Contact support** with:
   - What you were trying to do
   - The exact error message
   - Screenshots if possible

---

## Summary

**To make changes:**
1. Edit code locally
2. Test with `npm run dev`
3. Push to GitHub with `git push`
4. Build with `npm run build`
5. Upload `dist` folder to Hostinger
6. Test live site

**Your website will be updated!** 🚀

