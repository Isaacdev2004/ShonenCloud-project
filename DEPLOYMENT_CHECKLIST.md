# Hostinger Deployment Checklist

Use this checklist to ensure you don't miss any steps during deployment.

## Pre-Deployment

- [ ] Get Supabase credentials (URL and anon key)
- [ ] Create `.env` file with Supabase credentials
- [ ] Install dependencies: `npm install`
- [ ] Test build locally: `npm run build`
- [ ] Verify `dist` folder is created
- [ ] Check that `.htaccess` file exists

## Hostinger Setup

- [ ] Log in to Hostinger hPanel
- [ ] Navigate to File Manager
- [ ] Go to `public_html` directory
- [ ] Backup existing files (if any)

## Upload Files

- [ ] Delete old files in `public_html` (if updating)
- [ ] Upload all files from `dist` folder
- [ ] Upload `.htaccess` file to root
- [ ] Verify file permissions (644 for files, 755 for folders)

## Testing

- [ ] Visit your domain
- [ ] Test homepage loads correctly
- [ ] Test navigation between pages
- [ ] Test login/signup functionality
- [ ] Check browser console for errors
- [ ] Test on mobile device (responsive design)
- [ ] Verify Supabase connection works

## Post-Deployment

- [ ] Enable SSL certificate (if not already enabled)
- [ ] Set up custom domain (if needed)
- [ ] Update DNS records (if needed)
- [ ] Test all major features
- [ ] Monitor for any errors

## Quick Commands

```bash
# Build project
npm run build

# Preview build locally (optional)
npm run preview
```

---

**Note:** Keep your `.env` file secure and never commit it to Git!

