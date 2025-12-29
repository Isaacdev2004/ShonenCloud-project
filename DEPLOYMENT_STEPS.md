# 🚀 Complete Deployment Steps for New Arena System

## ⚠️ CRITICAL: Two-Part Deployment Required

The new Arena system requires **BOTH** database changes AND file uploads. Missing either part will cause the features not to show up.

---

## Part 1: Database Migration (Supabase) 🔴 REQUIRED

### Step 1: Run the Migration on Production Supabase

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to**: SQL Editor (left sidebar)
4. **Click**: "New query"
5. **Copy the ENTIRE contents** of this file:
   ```
   shonen-unity-project-main/supabase/migrations/20251202000000_new_arena_system.sql
   ```
6. **Paste into the SQL Editor**
7. **Click**: "Run" (or press Ctrl+Enter)
8. **Verify**: You should see "Success. No rows returned" or similar success message

### What This Migration Does:
- Adds new columns to `profiles` table (HP, ATK, Armor, Energy, Aura, Mastery, etc.)
- Creates new tables: `arena_sessions`, `arena_participants`, `player_statuses`, `action_cooldowns`, `technique_cooldowns`, `battle_feed`, etc.
- Adds new columns to `techniques` table (damage, armor_damage, tags, energy_cost, etc.)
- Sets up Row Level Security (RLS) policies

**⚠️ Without this migration, the Arena page will show errors or be blank!**

---

## Part 2: Upload Files to Hostinger 🔴 REQUIRED

### Step 1: Access Your Hostinger File Manager

1. **Log into Hostinger**: https://hpanel.hostinger.com
2. **Go to**: File Manager
3. **Navigate to**: Your website's public_html folder (or wherever your site files are)

### Step 2: Backup Current Files (Recommended)

1. **Select all files** in your public_html folder
2. **Create a ZIP backup** (or rename the folder to `public_html_backup_YYYYMMDD`)

### Step 3: Upload New Build Files

1. **Delete OLD files** from public_html:
   - Delete `index.html`
   - Delete `assets/` folder (if it exists)
   - Delete `favicon.ico`, `favicon.png`, `robots.txt`, `placeholder.svg`
   - **Keep**: Any `.htaccess` or server configuration files

2. **Upload ALL files from** `shonen-unity-project-main/dist/`:
   - Upload `index.html`
   - Upload entire `assets/` folder (with all its contents)
   - Upload `favicon.ico`, `favicon.png`, `robots.txt`, `placeholder.svg`

3. **Verify file structure**:
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-C123LBBf.js (or similar)
   │   ├── index-uAjoQ0KE.css (or similar)
   │   └── [all other asset files]
   ├── favicon.ico
   ├── favicon.png
   └── robots.txt
   ```

### Step 4: Set File Permissions (if needed)

- Files: `644` or `644`
- Folders: `755`

---

## Part 3: Clear Browser Cache 🔴 REQUIRED

After uploading files, users (including you) need to clear browser cache:

### Option 1: Hard Refresh
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### Option 2: Clear Cache Manually
1. **Chrome/Edge**: Settings → Privacy → Clear browsing data → Cached images and files
2. **Firefox**: Settings → Privacy → Clear Data → Cached Web Content
3. **Safari**: Develop → Empty Caches

### Option 3: Use Incognito/Private Mode
- Open the site in a new incognito/private window to test

---

## Part 4: Verify Deployment ✅

### Check These Features:

1. **Arena Page Loads**: No blank page or errors
2. **Stats Display**: See HP, ATK, Armor, Energy, Aura, Mastery stats
3. **Join Button**: "Join Arena" button appears
4. **Action Buttons**: Attack, Move Around, Observe, Change Zone buttons visible
5. **Timers**: Arena Status and Battle Timer display
6. **Zone Targeting**: "Target Zone" button next to each zone
7. **Player Popup**: Click on player profile pic shows stats popup
8. **Admin Panel**: New technique fields visible in Admin Panel

### If Features Still Don't Show:

1. **Check Browser Console** (F12):
   - Look for JavaScript errors
   - Check Network tab for failed file loads

2. **Verify Database Migration**:
   - Go to Supabase → Table Editor
   - Check if `profiles` table has `max_hp`, `current_hp`, `max_atk`, etc. columns
   - Check if `arena_sessions` table exists

3. **Verify File Upload**:
   - Check if `index.html` and `assets/` folder are in public_html
   - Check file sizes match (the JS file should be ~1.2MB)

4. **Check Supabase Connection**:
   - Verify your Supabase URL and anon key are correct in the built files
   - Check Supabase Dashboard → Settings → API for correct credentials

---

## Quick Troubleshooting

### Issue: "Arena page is blank"
- **Solution**: Database migration not run → Run Part 1

### Issue: "Old Arena page still showing"
- **Solution**: Browser cache → Clear cache (Part 3)

### Issue: "JavaScript errors in console"
- **Solution**: Check if all files uploaded correctly → Re-upload Part 2

### Issue: "Database errors"
- **Solution**: Migration incomplete → Re-run Part 1, check for errors

---

## Summary Checklist

- [ ] ✅ Database migration run on Supabase production
- [ ] ✅ Old files deleted from Hostinger
- [ ] ✅ New files uploaded to Hostinger
- [ ] ✅ Browser cache cleared
- [ ] ✅ Tested Arena page loads
- [ ] ✅ Tested all new features work
- [ ] ✅ Verified no console errors

---

## Need Help?

If issues persist after completing all steps:
1. Check browser console for specific error messages
2. Verify Supabase migration completed without errors
3. Confirm all dist files are uploaded correctly
4. Try accessing the site in incognito mode

