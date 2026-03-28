# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Netlify serverless function that proxies the MyClub (myclub.fi) API to provide a CORS-enabled endpoint for fetching upcoming events. Deployed on Netlify; no build step or package manager is used.

## Deployment

Deploy by pushing to the main branch — Netlify auto-deploys from Git. The function is served at `/.netlify/functions/events`.

To test locally using Netlify CLI:
```
netlify dev
```

## Architecture

Single serverless function at `netlify/functions/events.js`, configured via `netlify.toml`.

**Request flow:**
1. Validates `origin` header against `ALLOWED_ORIGIN` env var (returns 403 if mismatch)
2. Fetches from `https://api.myclub.fi/api/v2/groups/{MYCLUB_GROUP_ID}/events/` using `MYCLUB_API_KEY`
3. Filters to events from today onwards, limits to 20, orders by start time
4. Returns simplified event objects: `{ title, start_time, end_time, location, group }`

**HTTP methods:** `OPTIONS` (CORS preflight → 204), `GET` (fetch events), others → 405

**Caching:** 5-minute `Cache-Control: max-age=300` on successful responses

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `MYCLUB_DOMAIN` | Yes | Club subdomain (e.g. `yourclub` from `yourclub.myclub.fi`) |
| `MYCLUB_GROUP_ID` | Yes | MyClub group identifier (passed as query param) |
| `MYCLUB_API_KEY` | Yes | Sent as `X-myClub-token` header |
| `ALLOWED_ORIGIN` | No | Restricts CORS to a specific origin; defaults to `*` |

Set these in the Netlify dashboard under Site settings → Environment variables.
