# 🚀 START HERE - Claude Onboarding Platform

**Read this file first, then follow COWORK_DEPLOYMENT_GUIDE.md**

## What This Is

A team onboarding platform for Claude AI with 5 features:
1. **Personal Preferences** - Adaptive questionnaire
2. **Manage Memory** - Memory entries management
3. **Claude Skills** - Skill templates + custom builder
4. **Memory Files** - CLAUDE.md file generator
5. **Develop Projects** - Project documentation builder

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: Convex (real-time database)
- **Hosting**: Vercel (recommended)

## Quick Start for Cowork

**Tell Cowork:**
```
Follow COWORK_DEPLOYMENT_GUIDE.md to deploy this platform.
Execute each phase in order and verify success before continuing.
```

## Deployment Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Install dependencies | 2 min |
| 2 | Set up Convex | 5 min |
| 3 | Test locally | 5 min |
| 4 | Deploy Convex production | 2 min |
| 5 | Deploy to Vercel | 5 min |
| 6 | Verify deployment | 3 min |
| **Total** | | **~22 min** |

## Files in This Package

```
claude-onboarding-platform/
├── START_HERE.md              ← You are here
├── COWORK_DEPLOYMENT_GUIDE.md ← Step-by-step deployment
├── package.json               ← Dependencies
├── next.config.js             ← Next.js config
├── tsconfig.json              ← TypeScript config
├── tailwind.config.js         ← Styling config
├── postcss.config.js          ← PostCSS config
├── app/                       ← Next.js app directory
│   ├── layout.tsx             ← Root layout
│   ├── page.tsx               ← Main application (all features)
│   ├── globals.css            ← Global styles
│   └── ConvexClientProvider.tsx
└── convex/                    ← Backend functions
    ├── schema.ts              ← Database schema
    ├── users.ts               ← User functions
    ├── preferences.ts         ← Preferences functions
    └── memories.ts            ← Memories functions
```

## Prerequisites

- Node.js 18+
- npm
- Convex account (free at convex.dev)
- Vercel account (free at vercel.com)

## Success Criteria

After deployment, verify:
- [ ] Site loads at Vercel URL
- [ ] Can create account (enter name + email)
- [ ] Can navigate all 5 tabs
- [ ] Can fill preferences questionnaire
- [ ] Can add memory entries
- [ ] Data persists after refresh
- [ ] Can generate CLAUDE.md file

## Need Help?

If deployment fails:
1. Check error messages carefully
2. Verify all prerequisites are met
3. Try the manual steps in COWORK_DEPLOYMENT_GUIDE.md
4. Check Convex Dashboard for backend issues
5. Check Vercel Dashboard for deployment issues

---

**Ready? Open COWORK_DEPLOYMENT_GUIDE.md and start Phase 1!**
