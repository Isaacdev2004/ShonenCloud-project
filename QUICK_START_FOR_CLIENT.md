# Quick Start Guide for Client

## 🚀 Getting Started (5 Minutes)

### 1. Install Software
- **Node.js**: https://nodejs.org/ (Download and install LTS version)
- **Git**: https://git-scm.com/downloads (Download and install)

### 2. Get the Code
```bash
git clone https://github.com/Isaacdev2004/ShonenCloud-project.git
cd ShonenCloud-project
npm install
```

### 3. Set Up Environment
Create a `.env` file in the project root with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

### 4. Test Locally
```bash
npm run dev
```
Visit: http://localhost:8080

---

## 📝 Making Changes & Deploying

### Simple Workflow (Every Time):

1. **Make changes** → Edit files in `src/` folder
2. **Test locally** → `npm run dev` (see changes at http://localhost:8080)
3. **Build** → `npm run build`
4. **Deploy** → Upload `dist` folder to Hostinger
5. **Save to GitHub** → `git add .` → `git commit -m "message"` → `git push`

### Detailed Instructions:
- **Full Guide**: See `CLIENT_WORKFLOW_GUIDE.md`
- **Auto-Deploy Setup**: See `AUTOMATED_DEPLOYMENT_SETUP.md`

---

## 🎯 Most Common Tasks

### Change Text on Homepage
1. Edit: `src/pages/Index.tsx`
2. Run: `npm run build`
3. Upload `dist` folder to Hostinger

### Add New Feature
1. Create/edit files in `src/`
2. Test: `npm run dev`
3. Build: `npm run build`
4. Upload to Hostinger

---

## ⚡ Automated Deployment (Optional)

Set up once, then every push to GitHub automatically updates your live site!

**Setup**: See `AUTOMATED_DEPLOYMENT_SETUP.md`

**After setup**: Just push code → Site updates automatically!

---

## 🆘 Need Help?

- Check `CLIENT_WORKFLOW_GUIDE.md` for detailed instructions
- Check `TROUBLESHOOTING.md` for common issues
- Contact your developer

---

**That's it! You're ready to make changes! 🎉**

