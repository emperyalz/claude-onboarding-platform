# 🚀 COWORK DEPLOYMENT GUIDE
## Claude Onboarding Platform - Complete Deployment Instructions

**Total Time: ~22 minutes**
**Difficulty: Easy**

---

## PHASE 1: INSTALL DEPENDENCIES (2 minutes)

### Step 1.1: Verify Node.js
```bash
node --version
# Expected: v18.x.x or higher
```

If Node.js is not installed or version is too low:
```bash
# Install via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### Step 1.2: Install Project Dependencies
```bash
npm install
```

**Expected Output:**
```
added XXX packages in Xs
```

**Verification:** No errors in output

---

## PHASE 2: SET UP CONVEX (5 minutes)

### Step 2.1: Login to Convex
```bash
npx convex login
```

This opens a browser for authentication. Complete the login.

**Expected Output:**
```
✔ Logged in as your@email.com
```

### Step 2.2: Initialize Convex Dev Environment
```bash
npx convex dev
```

**First run will:**
1. Ask to create a new project → Select **"Create a new project"**
2. Ask for project name → Enter **"claude-onboarding-platform"**
3. Create `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
4. Start watching for changes

**Expected Output:**
```
✔ Created project "claude-onboarding-platform"
✔ Deployed functions
Convex functions ready! Visit https://dashboard.convex.dev
```

**Keep this terminal running!** Open a new terminal for next steps.

---

## PHASE 3: TEST LOCALLY (5 minutes)

### Step 3.1: Start Development Server
Open a **new terminal** (keep Convex running):

```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
✓ Ready in Xs
```

### Step 3.2: Test the Application

Open http://localhost:3000 in your browser.

**Test Checklist:**
- [ ] Login page loads with Claude branding
- [ ] Can enter name and email to "Get Started"
- [ ] After login, see 5 tabs:
  - [ ] Personal Preferences
  - [ ] Manage Memory
  - [ ] Claude Skills
  - [ ] Memory Files
  - [ ] Develop Projects
- [ ] Can answer questionnaire questions
- [ ] Can add memory entries
- [ ] Can view skill templates
- [ ] Can generate CLAUDE.md file

**If all checks pass, proceed to Phase 4!**

---

## PHASE 4: DEPLOY CONVEX TO PRODUCTION (2 minutes)

### Step 4.1: Stop Convex Dev
In the terminal running `npx convex dev`, press **Ctrl+C** to stop.

### Step 4.2: Deploy to Production
```bash
npx convex deploy
```

**Expected Output:**
```
✔ Deployed to production
Production URL: https://xxxx-xxxx-xxxx.convex.cloud
```

**IMPORTANT:** Copy the production URL! You'll need it for Vercel.

### Step 4.3: Save Production URL
```bash
echo "Production Convex URL: https://xxxx-xxxx-xxxx.convex.cloud"
```

Save this URL for Phase 5.

---

## PHASE 5: DEPLOY TO VERCEL (5 minutes)

### Option A: Vercel CLI (Recommended)

#### Step 5A.1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 5A.2: Login to Vercel
```bash
vercel login
```

Complete authentication in browser.

#### Step 5A.3: Deploy
```bash
vercel
```

**Follow prompts:**
- Set up and deploy? **Y**
- Which scope? **[Select your account]**
- Link to existing project? **N**
- Project name? **claude-onboarding-platform**
- Directory? **./**
- Override settings? **N**

#### Step 5A.4: Add Environment Variable
```bash
vercel env add NEXT_PUBLIC_CONVEX_URL
```

When prompted:
- Value: **[Paste your Convex production URL from Phase 4]**
- Environments: **Production, Preview, Development** (select all)

#### Step 5A.5: Deploy to Production
```bash
vercel --prod
```

**Expected Output:**
```
✅ Production: https://claude-onboarding-platform-xxxxx.vercel.app
```

---

### Option B: Vercel Dashboard

1. Go to https://vercel.com/new
2. Click **"Import Project"**
3. **Add Environment Variable** before deploying:
   - Key: `NEXT_PUBLIC_CONVEX_URL`
   - Value: [Your Convex production URL]
4. Click **"Deploy"**

---

## PHASE 6: VERIFY DEPLOYMENT (3 minutes)

### Step 6.1: Open Production Site
Visit your Vercel URL (e.g., https://claude-onboarding-platform-xxxxx.vercel.app)

### Step 6.2: Complete Verification Checklist

**Must Pass All:**
- [ ] Site loads (no errors)
- [ ] Login page displays correctly
- [ ] Can create account (name + email)
- [ ] All 5 tabs visible after login
- [ ] Personal Preferences questionnaire works
- [ ] Can add memory entries
- [ ] Memory entries persist after refresh
- [ ] Skills page shows 6 default templates
- [ ] Can generate CLAUDE.md file
- [ ] File download works

### Step 6.3: Check for Errors

**Browser Console:**
- Open DevTools (F12) → Console tab
- Should be no red errors

**Convex Dashboard:**
- Go to https://dashboard.convex.dev
- Select your project
- Check Logs tab for errors

**Vercel Dashboard:**
- Go to https://vercel.com/dashboard
- Select your project
- Check Deployments for any build errors

---

## 🎉 DEPLOYMENT COMPLETE!

**Your Claude Onboarding Platform is live!**

### Share with your team:
```
URL: https://[your-project].vercel.app

How to use:
1. Enter your name and email
2. Complete the Personal Preferences questionnaire
3. Add memories Claude should remember
4. Explore skill templates
5. Generate your CLAUDE.md file
6. Use the file to personalize Claude!
```

---

## TROUBLESHOOTING

### "Module not found" error
```bash
rm -rf node_modules package-lock.json
npm install
```

### Convex connection failed
1. Check `.env.local` exists with `NEXT_PUBLIC_CONVEX_URL`
2. Verify URL is correct in Convex Dashboard
3. Run `npx convex dev` again

### Vercel build failed
1. Check build logs in Vercel Dashboard
2. Verify environment variable is set
3. Try redeploying: `vercel --prod --force`

### Data not persisting
1. Check Convex Dashboard → Data tab
2. Verify functions deployed correctly
3. Check browser console for errors

### White screen / 500 error
1. Check Vercel Function logs
2. Verify Convex production URL is correct
3. Redeploy both Convex and Vercel

---

## QUICK REFERENCE

**Local Development:**
```bash
npx convex dev  # Terminal 1
npm run dev     # Terminal 2
# Open http://localhost:3000
```

**Redeploy:**
```bash
npx convex deploy  # Backend
vercel --prod      # Frontend
```

**Check Status:**
- Convex: https://dashboard.convex.dev
- Vercel: https://vercel.com/dashboard

---

**Deployment complete! 🚀**
