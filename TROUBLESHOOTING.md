# Troubleshooting Hostinger Deployment

## Quick Diagnostic Steps

### 1. Check Browser Console (F12)
**Most Important!** Open Developer Tools (F12) and check the Console tab for errors.

Common errors:
- **404 errors on assets** → Files not uploaded correctly
- **CORS errors** → Supabase configuration issue
- **Blank page** → JavaScript error or missing files

### 2. Verify File Structure on Hostinger

In Hostinger File Manager, your `public_html` should have:
```
public_html/
├── .htaccess
├── index.html
├── favicon.ico
├── favicon.png
├── placeholder.svg
├── robots.txt
└── assets/
    ├── index-BFKyfl86.js
    ├── index-F4W8rxeC.css
    └── [all other asset files]
```

**Important:** Files should be directly in `public_html`, NOT in a `dist` subfolder!

### 3. Check .htaccess File

Verify `.htaccess` is:
- ✅ In the root of `public_html`
- ✅ Named exactly `.htaccess` (with the dot)
- ✅ Contains the rewrite rules
- ✅ File permissions: 644

### 4. Test Direct File Access

Try accessing these URLs directly:
- `https://yourdomain.com/index.html` → Should show the page
- `https://yourdomain.com/assets/index-BFKyfl86.js` → Should download the JS file
- `https://yourdomain.com/assets/index-F4W8rxeC.css` → Should show CSS

If these don't work, files aren't uploaded correctly.

### 5. Check Environment Variables

If you see Supabase errors:
1. Verify `.env` file exists locally with correct values
2. Rebuild: `npm run build`
3. Re-upload the new `dist` folder

### 6. Clear Browser Cache

- Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear cache in browser settings

### 7. Check File Permissions

In Hostinger File Manager:
- Files should be: **644**
- Folders should be: **755**

Right-click file → Change Permissions

---

## Common Issues & Solutions

### Issue: White/Blank Page

**Solution:**
1. Check browser console (F12) for errors
2. Verify `index.html` exists in `public_html` root
3. Check that `assets` folder is uploaded
4. Verify `.htaccess` is present
5. Try accessing `https://yourdomain.com/index.html` directly

### Issue: 404 on Page Refresh

**Solution:**
1. Verify `.htaccess` is in `public_html` root
2. Check file permissions (644)
3. Contact Hostinger support to enable `mod_rewrite` if needed

### Issue: Assets Not Loading (404 errors)

**Solution:**
1. Verify `assets` folder is uploaded completely
2. Check file paths in browser console
3. Ensure files are in `public_html/assets/` not `public_html/dist/assets/`
4. Check file permissions

### Issue: Supabase Connection Errors

**Solution:**
1. Check `.env` file has correct values
2. Rebuild: `npm run build`
3. Re-upload `dist` folder
4. Verify Supabase project is active

### Issue: "Cannot GET /" or Directory Listing

**Solution:**
- `.htaccess` is missing or not working
- Upload `.htaccess` to `public_html` root
- Check file permissions

---

## Step-by-Step Fix

1. **Delete everything in `public_html`**
2. **Re-upload all files from `dist` folder** (contents, not the folder itself)
3. **Upload `.htaccess` to root**
4. **Set permissions:**
   - Files: 644
   - Folders: 755
5. **Clear browser cache** (Ctrl+F5)
6. **Test again**

---

## Still Not Working?

Share these details:
1. What error message do you see? (screenshot if possible)
2. Browser console errors (F12 → Console tab)
3. What happens when you visit the domain? (blank page, error page, etc.)
4. Can you access `yourdomain.com/index.html` directly?

