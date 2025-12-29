# Supabase Connection Error Fix

## Problem
You're experiencing `ERR_NAME_NOT_RESOLVED` errors when trying to connect to Supabase. This means the browser cannot resolve the Supabase domain name.

## Common Causes

1. **Supabase Project is Paused or Deleted**
   - Free tier projects pause after inactivity
   - Check your Supabase dashboard: https://supabase.com/dashboard

2. **Incorrect Supabase URL in .env file**
   - The URL might be outdated or incorrect
   - Verify the URL matches your current Supabase project

3. **Environment Variables Not Set During Build**
   - The `.env` file must exist before running `npm run build`
   - Vite embeds environment variables at build time

## Solution Steps

### Step 1: Verify Supabase Project Status

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Check if your project is **Active** (not paused)
4. If paused, click **Restore** or **Resume** to reactivate it

### Step 2: Get Correct Supabase Credentials

1. In your Supabase dashboard, select your project
2. Go to **Settings** → **API**
3. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### Step 3: Update .env File

1. Navigate to your project root: `shonen-unity-project-main`
2. Open or create the `.env` file
3. Add/update these lines:

```env
VITE_SUPABASE_URL=https://your-actual-project-url.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-actual-anon-key-here
```

**Important:** 
- Replace `your-actual-project-url` with your real Supabase project URL
- Replace `your-actual-anon-key-here` with your real anon key
- Do NOT include quotes around the values
- Make sure there are no spaces around the `=` sign

### Step 4: Rebuild the Project

After updating the `.env` file, rebuild:

```bash
npm run build
```

This will embed the correct environment variables into the build.

### Step 5: Redeploy to Hostinger

1. Upload the new `dist` folder contents to Hostinger
2. Clear browser cache (Ctrl+F5)
3. Test the login again

## Verification

To verify your Supabase connection is working:

1. Open browser console (F12)
2. Try to log in
3. Check for any errors
4. If you see `ERR_NAME_NOT_RESOLVED`, the URL is still incorrect
5. If you see authentication errors, the connection is working but credentials might be wrong

## Quick Test

You can test if your Supabase URL is correct by:

1. Opening a new browser tab
2. Navigate to: `https://your-supabase-url.supabase.co/rest/v1/`
3. If you see a JSON response (even an error), the URL is correct
4. If you see "This site can't be reached" or DNS error, the URL is wrong or project is paused

## Still Having Issues?

If the problem persists:

1. **Check Supabase Project Status**: Ensure it's not paused
2. **Verify URL Format**: Should be `https://xxxxx.supabase.co` (no trailing slash)
3. **Check Network**: Try from a different network to rule out DNS issues
4. **Contact Support**: If project is active and URL is correct, contact Supabase support

## Prevention

- Keep your Supabase project active (use it regularly or upgrade if needed)
- Always verify `.env` file exists before building
- Test locally with `npm run dev` before deploying
- Keep a backup of your Supabase credentials in a secure location

