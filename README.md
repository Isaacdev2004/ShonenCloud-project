# ShonenCloud - RPG Adventure Platform

## Project Overview

ShonenCloud is an epic RPG adventure platform where users can choose their discipline, learn from legendary mentors, and master powerful techniques.

## Getting Started

### Prerequisites

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

Follow these steps to set up the project locally:

```sh
# Step 1: Navigate to the project directory.
cd shonen-unity-project-main

# Step 2: Install the necessary dependencies.
npm install

# Step 3: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Building for Production

```sh
# Build the project for production
npm run build

# Preview the production build
npm run preview
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

To deploy this project:

1. Build the project using `npm run build`
2. Upload the `dist` folder contents to your hosting provider (e.g., Hostinger)
3. Configure your server to serve the built files

**For detailed deployment instructions, see:**
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `CLIENT_WORKFLOW_GUIDE.md` - How to make changes and deploy
- `AUTOMATED_DEPLOYMENT_SETUP.md` - Set up automatic deployment

## Project Structure

The main application code is located in the `src` directory. The entry point is `src/main.tsx`, and the root component is rendered in `index.html`.

## Making Changes & Deploying

**Quick workflow:**
1. Make changes → Edit code files
2. Test locally → `npm run dev`
3. Build → `npm run build`
4. Deploy → Upload `dist` folder to Hostinger

**See `CLIENT_WORKFLOW_GUIDE.md` for detailed instructions.**
