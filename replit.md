# Vistari - GCSE Study Planning Application

## Overview
Vistari is a GCSE revision planner that creates personalized study timetables that fit around student schedules. Originally built on Lovable, migrated to Replit with Open Router AI integration.

## Recent Changes
**November 28, 2025 - SECURITY FIX**
- **FIXED**: All 7 Supabase edge functions now use `Deno.env.get('OPEN_ROUTER_API_KEY')` for secure server-side secret management
- **Security**: Removed all apiKey passing from frontend - API keys now only exist on the server
- Previously migrated all 9 Supabase edge functions to use Open Router API
- Switched AI model to `google/gemma-3n-e4b-it:free` for cost optimization
- Fixed Gemma model limitation: merged system messages into user messages (Gemma 3n doesn't support developer/system instructions)

## ⚠️ CRITICAL SETUP REQUIREMENT

**You must set the Open Router API Key as a secret in your Supabase project:**

1. Go to your Supabase project dashboard
2. Navigate to Settings → Secrets
3. Create a new secret named `OPEN_ROUTER_API_KEY`
4. Paste your Open Router API key: `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`
5. Save the secret

**Without this secret configured, all AI features (timetable generation, topic analysis, test scoring) will fail.**

## AI Configuration
- **Provider**: Open Router (openrouter.ai)
- **Model**: `google/gemma-3n-e4b-it:free` - Google Gemma 3n 4B (free tier)
- **API Key**: Stored as `OPEN_ROUTER_API_KEY` in Supabase secrets (NOT in Replit environment)
- **Important**: Gemma 3n doesn't support system instructions, so all prompts use single user message format

## Edge Functions Using AI (supabase/functions/)
1. **generate-timetable** - Creates personalized study schedules (uses Gemma 3n)
2. **analyze-difficulty** - Analyzes topic difficulty and priorities
3. **validate-email** - AI-assisted email validation with Gemma 3n
4. **analyze-test-score** - Provides feedback on test performance (uses Gemma 3n)
5. **generate-insights** - Creates learning analytics and insights (uses Gemma 3n)
6. **parse-topics** - Extracts topics from text/images (uses Gemma 3n, text-only)
7. **adjust-schedule** - Modifies schedules based on user requests (uses Gemma 3n)
8. **regenerate-tomorrow** - Regenerates next day's schedule (uses Gemma 3n)

## Project Structure
- `/client` - React frontend with Vite (no API key access)
- `/server` - Express backend
- `/supabase/functions` - Edge functions with server-side secret access
- `/shared` - Shared types and schemas

## Running the Project
The workflow "Start application" runs `npm run dev` which starts both frontend and backend on port 5000.

## User Preferences
- Cost optimization: Using free Gemma 3n model instead of paid alternatives
- AI features: Study planning, difficulty analysis, schedule adjustments
- Security-first: All API keys stay on the server, not passed through frontend

## Technical Notes
- All Deno edge functions access secrets via `Deno.env.get('OPEN_ROUTER_API_KEY')`
- Frontend never receives or stores API keys
- Application is production-ready after Supabase secret is configured
