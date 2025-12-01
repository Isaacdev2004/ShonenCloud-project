# Hostinger Deployment Guide for ShonenCloud

This guide will walk you through deploying your ShonenCloud React/Vite application to Hostinger.

## Prerequisites

- Hostinger hosting account (Shared Hosting or VPS)
- Access to Hostinger File Manager or FTP credentials
- Your Supabase project credentials
- Node.js installed on your local machine (for building)

---

## Step 1: Prepare Environment Variables

Your project requires Supabase environment variables. You need to create a `.env` file` before building.

1. In your project root, create a `.env` file (if it doesn't exist)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

**Where to find these:**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the "Project URL" → `VITE_SUPABASE_URL`
- Copy the "anon public" key → `VITE_SUPABASE_PUBLISHABLE_KEY`

**Important:** Never commit `.env` files to Git! They should be in `.gitignore`.

---

## Step 2: Build the Project for Production

1. **Open terminal/command prompt** in your project directory:
   ```bash
   cd shonen-unity-project-main
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Verify the build**:
   - A `dist` folder should be created
   - This folder contains all the production-ready files

---

## Step 3: Prepare Files for Upload

After building, you'll have a `dist` folder. This is what you'll upload to Hostinger.

**Files to upload:**
- Everything inside the `dist` folder
- The `.htaccess` file (for SPA routing - we'll create this)

---

## Step 4: Access Hostinger File Manager

1. **Log in to Hostinger**:
   - Go to https://hpanel.hostinger.com
   - Log in with your credentials

2. **Navigate to File Manager**:
   - Click on "Hosting" in the left sidebar
   - Find your domain and click "Manage"
   - Click on "File Manager"

3. **Navigate to public_html**:
   - This is your website's root directory
   - For subdomains, it might be in a subfolder like `public_html/subdomain`

---

## Step 5: Upload Files to Hostinger

### Option A: Using File Manager (Recommended for beginners)

1. **Delete old files** (if any):
   - Select all files in `public_html` (except `.htaccess` if you want to keep it)
   - Delete them

2. **Upload the dist folder contents**:
   - Click "Upload" button
   - Select all files from your local `dist` folder
   - Wait for upload to complete

3. **Upload .htaccess file**:
   - Upload the `.htaccess` file to `public_html` root

### Option B: Using FTP (Faster for large files)

1. **Get FTP credentials**:
   - In Hostinger hPanel → Hosting → Manage
   - Go to "FTP Accounts"
   - Note your FTP host, username, and password

2. **Use FTP client** (FileZilla, WinSCP, etc.):
   - Connect using your FTP credentials
   - Navigate to `public_html`
   - Upload all files from `dist` folder
   - Upload `.htaccess` file

---

## Step 6: Configure .htaccess for SPA Routing

The `.htaccess` file is crucial for React Router to work properly. It redirects all requests to `index.html` so your routes work correctly.

**The `.htaccess` file should already be created in your project root.** Make sure it's uploaded to `public_html`.

If you need to create it manually in Hostinger:
1. In File Manager, click "New File"
2. Name it `.htaccess` (with the dot at the beginning)
3. Copy the contents from the `.htaccess` file in your project

---

## Step 7: Verify Deployment

1. **Visit your website**:
   - Go to your domain (e.g., `https://yourdomain.com`)
   - The site should load

2. **Test navigation**:
   - Click through different pages
   - Verify that routes work (no 404 errors)
   - Test login/signup functionality

3. **Check browser console**:
   - Open Developer Tools (F12)
   - Check for any errors
   - Verify Supabase connection is working

---

## Step 8: Set Up Custom Domain (If Needed)

If you're using a custom domain:

1. **In Hostinger hPanel**:
   - Go to Hosting → Manage
   - Click "Domains"
   - Add your custom domain
   - Update DNS records if needed

2. **SSL Certificate**:
   - Hostinger usually provides free SSL
   - Enable it in hPanel → SSL
   - Your site will be accessible via HTTPS

---

## Troubleshooting

### Issue: White screen or blank page
**Solution:**
- Check browser console for errors
- Verify `.htaccess` file is uploaded correctly
- Ensure all files from `dist` folder are uploaded
- Check file permissions (should be 644 for files, 755 for folders)

### Issue: 404 errors on page refresh
**Solution:**
- Verify `.htaccess` file is in `public_html` root
- Check that `.htaccess` contains the rewrite rules
- Ensure mod_rewrite is enabled (contact Hostinger support if needed)

### Issue: Supabase connection errors
**Solution:**
- Verify environment variables were set before building
- Rebuild the project with correct `.env` file
- Check Supabase project is active and credentials are correct

### Issue: Images/assets not loading
**Solution:**
- Check file paths are correct (should be relative paths)
- Verify all assets were uploaded
- Check file permissions

### Issue: Slow loading
**Solution:**
- Enable caching in `.htaccess` (already included)
- Consider using Hostinger's CDN if available
- Optimize images before uploading

---

## Updating Your Website

When you make changes:

1. **Update code locally**
2. **Rebuild**: `npm run build`
3. **Upload new `dist` folder contents** to Hostinger
4. **Clear browser cache** or do hard refresh (Ctrl+F5)

---

## Important Notes

- **Environment Variables**: Vite embeds environment variables at build time. You must rebuild if you change them.
- **Build Folder**: Always upload the contents of `dist` folder, not the folder itself
- **File Permissions**: Files should be 644, folders should be 755
- **Backup**: Always backup your current site before uploading new files

---

## Need Help?

- Hostinger Support: https://www.hostinger.com/contact
- Check Hostinger documentation: https://support.hostinger.com

---

## Quick Command Reference

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build locally (optional)
npm run preview
```

---

**Your website should now be live on Hostinger! 🚀**

