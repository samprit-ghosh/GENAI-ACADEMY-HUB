# GenAI Academy & Hub

The ultimate dual-purpose knowledge portal for casual learners and deep-dive researchers.

## Features
- **Three-Column Dashboard**: Navigate seamlessly between media sources, active documents, and audio tracks.
- **Synchronized Scroll**: Compare two papers side-by-side with perfectly synced scrolling.
- **Persistent Audio**: Continue listening to AI-generated paper insights while you browse the site.
- **Performant**: Built with Next.js App Router and optimized for instantaneous loading and advanced SEO.
- **Monorepo Architecture**: Clean separation of web UI and scraping/database services.

## Tech Stack
- **Frontend**: Next.js 15+ (App Router), React, Tailwind CSS, Shadcn UI
- **Database**: PostgreSQL (pgvector support), Prisma ORM
- **Services**: Python-based TTS generation (Edge-TTS) and data scrapers

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Local Database**:
   ```bash
   docker-compose up -d
   ```

3. **Initialize Database**:
   ```bash
   npm run prisma:generate --workspace=@my-genai-hub/database
   npm run prisma:push --workspace=@my-genai-hub/database
   npm run seed --workspace=@my-genai-hub/scrapers
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Open Source & SaaS Ready
This repository is pre-configured to be deployed effortlessly. Hit the button below to deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fmy-genai-hub)
