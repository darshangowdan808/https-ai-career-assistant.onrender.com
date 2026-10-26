# 🚀 Publishing & Deploying AI Career Assistant to Render.com

This guide provides instructions to publish the **AI Career Assistant** as a live public website on **Render.com** (100% Free Tier with 24/7 HTTPS).

---

## 🏗️ Pre-configured Deployment Architecture

The application has been unified for production:
* **Single Unified Port & Service:** The Node.js Express server automatically serves the compiled React + Vite frontend (`frontend/dist`) and all `/api/*` endpoints on the same host with zero CORS friction.
* **Database:** SQLite with Prisma Client pre-configured.
* **Blueprint:** `render.yaml` in the repository root enables automated 1-click infrastructure setup.

---

## 📋 Step 1: Push Project to GitHub

Render deploys directly from GitHub.

### Option A: Using Git (Command Line)
If Git is installed on your computer:
```powershell
# 1. Initialize Git repository
git init

# 2. Stage and commit all files
git add .
git commit -m "feat: complete AI Career Assistant with 5-round mock interview & India job board"

# 3. Rename branch to main
git branch -M main

# 4. Link your remote GitHub repository (Create one at https://github.com/new first)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ai-career-assistant.git

# 5. Push to GitHub
git push -u origin main
```

*(If you don't have Git installed, run `winget install --id Git.Git -e --source winget` in PowerShell or download it from [git-scm.com](https://git-scm.com)).*

---

## 🌐 Step 2: Deploy on Render.com

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in (or create a free account).
2. Click the **"New +"** button at the top right and select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and connect your GitHub account.
4. Select your **`ai-career-assistant`** repository.
5. Fill in the deployment settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `ai-career-assistant` *(or your preferred URL slug)* |
| **Region** | Select the region closest to your users (e.g., `Singapore` for India/Asia or `Frankfurt` for Europe) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm run install:all && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** ($0/month) |

6. In **Environment Variables** (Advanced / Environment), verify or add:
   * `NODE_ENV` = `production`
   * `JWT_SECRET` = *(Click "Generate" or type a secret key)*
   * `PORT` = `10000` *(Render sets this automatically)*

7. Click **"Deploy Web Service"**.

---

## ⏱️ Step 3: Deployment Verification

Render will automatically run:
1. `npm install` for frontend & backend dependencies.
2. `tsc && vite build` (builds the React UI).
3. `prisma generate && tsc` (compiles the TypeScript API).
4. `prisma db push` (initializes database tables).
5. Starts the server with `node backend/dist/index.js`.

Once the log displays `🚀 AI Career Assistant Backend listening on port...`, your site will be live at:
👉 **`https://ai-career-assistant.onrender.com`**

---

## ⚡ Instant Preview Option (No Sign-up Needed)

While preparing your GitHub repository, you can share or test the website right now via our live local tunnel:
* **Live Tunnel URL:** `https://ai-career-assistant.loca.lt`
* **Tunnel Password / IP:** `152.57.134.124` *(Enter if prompted on first visit)*
