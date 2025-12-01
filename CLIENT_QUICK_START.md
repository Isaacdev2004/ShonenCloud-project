# Quick Start Guide for Client

## First Time Setup (Do This Once)

1. **Install Node.js**: https://nodejs.org/ (Download LTS version)
2. **Install Git**: https://git-scm.com/ (Usually comes with Node.js)
3. **Install VS Code**: https://code.visualstudio.com/ (Free code editor)

4. **Clone the project**:
   ```bash
   git clone https://github.com/Isaacdev2004/ShonenCloud-project.git
   cd ShonenCloud-project/shonen-unity-project-main
   npm install
   ```

5. **Create `.env` file** with your Supabase credentials (ask developer for these)

---

## Every Time You Make Changes

### Step 1: Make Your Changes
- Open project in VS Code
- Edit files as needed
- Save files (Ctrl+S)

### Step 2: Test Locally
```bash
npm run dev
```
- View at http://localhost:8080
- Check your changes look good
- Press Ctrl+C to stop

### Step 3: Push to GitHub
```bash
git add .
git commit -m "What you changed"
git push origin main
```

### Step 4: Deploy to Live Site
```bash
npm run build
```
- Then upload `dist` folder contents to Hostinger `public_html`
- Visit your site to verify changes

---

## Need Help?
See `CLIENT_EDITING_GUIDE.md` for detailed instructions.

