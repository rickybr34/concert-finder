# Concert Finder

A simple web app that extends the Lab 1 Ticketmaster concert agent. Users ask natural-language questions (city + ZIP + date), and an AI agent uses tools to check Eastern Time and search Ticketmaster within 25 miles of that ZIP by default.

## Stack

- Next.js (App Router) + TypeScript
- Vercel AI SDK + OpenRouter (`openrouter/free`)
- Ticketmaster Discovery API

## Setup

1. Install dependencies:

```bash
cd concert-finder
npm install
```

2. Copy env vars and fill in your keys:

```bash
cp .env.example .env.local
```

3. Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and try:

> What is today's date, and are there any concerts near Boston 02115 today?

## Deploy on Vercel

1. Push this project to GitHub.
2. Import the `concert-finder` repository as a Vercel project.
3. In **Project Settings → Environment Variables**, add:
   - `OPENROUTER_API_KEY`
   - `TICKETMASTER_API_KEY`
4. Deploy.

Or from this directory:

```bash
npx vercel
```

Then set the same env vars in the Vercel dashboard and redeploy.

## Agent tools

| Tool | Purpose |
|------|---------|
| `getCurrentTime` | Current date/time in America/New_York |
| `searchConcerts` | Ticketmaster music events within 25 miles of a postal code (optional day and radius filters) |

The agent asks for city/zip if missing and never invents concert results.
