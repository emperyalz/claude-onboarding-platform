# Claude Onboarding Platform

A team onboarding platform for personalized Claude AI experiences.

## Features

1. **Personal Preferences** - Adaptive questionnaire to understand user needs
2. **Manage Memory** - Create memory entries for Claude to remember
3. **Claude Skills** - Pre-built skill templates + custom skill builder
4. **Memory Files** - Generate CLAUDE.md configuration files
5. **Develop Projects** - Build comprehensive project documentation

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database)
- **Hosting**: Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Start Convex (Terminal 1)
npx convex dev

# Start Next.js (Terminal 2)
npm run dev

# Open http://localhost:3000
```

## Deploy

See `COWORK_DEPLOYMENT_GUIDE.md` for full deployment instructions.

```bash
# Deploy Convex
npx convex deploy

# Deploy to Vercel
vercel --prod
```

## Environment Variables

```env
NEXT_PUBLIC_CONVEX_URL=your-convex-url
```

## License

MIT

