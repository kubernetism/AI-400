# Vercel Deployment Patterns

## Overview

Vercel is the native Next.js platform, providing zero-config deployment with automatic optimizations for every Next.js feature.

---

## Zero-Config Deployment

### Initial Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root (first time)
vercel

# Production deployment
vercel --prod
```

### Automatic Detection

Vercel automatically detects:
- Framework (Next.js, React, Vue, etc.)
- Build command (`next build`)
- Output directory (`.next`)
- Node.js version

---

## Git Integration

### Automatic Deployments

```
main branch     → Production deployment (your-app.vercel.app)
feature branch  → Preview deployment (your-app-git-feature-team.vercel.app)
Pull Request    → Preview with unique URL + PR comment
```

### vercel.json Configuration

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "git": {
    "deploymentEnabled": {
      "main": true,
      "staging": true
    }
  }
}
```

---

## Preview Deployments

### Features

- Automatic unique URL for each PR
- Comments on GitHub/GitLab with preview link
- Shareable with stakeholders
- Password protection available

### Protected Previews

```json
// vercel.json
{
  "passwordProtection": {
    "deploymentType": "preview"
  }
}
```

---

## Environment Variables

### Configuration Methods

**1. Vercel Dashboard**
Settings → Environment Variables

**2. Vercel CLI**
```bash
# Add variable
vercel env add VARIABLE_NAME

# Pull to local
vercel env pull .env.local

# List variables
vercel env ls
```

**3. vercel.json**
```json
{
  "env": {
    "API_URL": "https://api.example.com"
  }
}
```

### Environment Types

| Type | When Used |
|------|-----------|
| Production | Live production deployment only |
| Preview | All preview/branch deployments |
| Development | Local development (`vercel dev`) |

### Sensitive Variables

```bash
# Add encrypted secret
vercel secrets add my-api-key "sk-1234567890"

# Reference in vercel.json
{
  "env": {
    "API_KEY": "@my-api-key"
  }
}
```

### Next.js Environment Variables

```env
# .env.local (local development)
# .env.production (production)
# .env.development (development)

# Public (exposed to browser)
NEXT_PUBLIC_API_URL=https://api.example.com

# Private (server-only)
DATABASE_URL=postgresql://...
API_SECRET=secret123
```

---

## Edge Functions & Middleware

### Middleware Pattern

```typescript
// middleware.ts (project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Authentication check
  const token = request.cookies.get('auth-token')?.value

  // Protected routes
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Add custom headers
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Edge Runtime API Route

```typescript
// app/api/edge/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'World'

  return new Response(
    JSON.stringify({ message: `Hello, ${name}!` }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
```

### Geolocation & IP

```typescript
// middleware.ts
import { geolocation, ipAddress } from '@vercel/functions'

export function middleware(request: NextRequest) {
  const geo = geolocation(request)
  const ip = ipAddress(request)

  // Redirect based on country
  if (geo.country === 'DE') {
    return NextResponse.redirect(new URL('/de', request.url))
  }

  return NextResponse.next()
}
```

---

## Data Cache & ISR

### Static Generation with Revalidation

```typescript
// app/products/page.tsx
export const revalidate = 3600 // Revalidate every hour

export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductList products={products} />
}
```

### Dynamic Rendering

```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await getDashboardData()
  return <Dashboard data={data} />
}
```

### On-Demand Revalidation

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { path, tag, secret } = await request.json()

  // Verify secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 })
  }

  if (path) {
    revalidatePath(path)
  }

  if (tag) {
    revalidateTag(tag)
  }

  return Response.json({ revalidated: true, now: Date.now() })
}
```

### Fetch with Tags

```typescript
// lib/api.ts
export async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: {
      tags: ['products'],
      revalidate: 3600,
    },
  })
  return res.json()
}

// Revalidate with: revalidateTag('products')
```

---

## Custom Domains

### Setup Steps

1. Go to Project Settings → Domains
2. Add your domain (e.g., `example.com`)
3. Configure DNS records
4. Wait for SSL certificate provisioning

### DNS Configuration

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

### Redirect www to apex

```json
// vercel.json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "www.example.com" }],
      "destination": "https://example.com/:path*",
      "permanent": true
    }
  ]
}
```

---

## Build Configuration

### Custom Build Command

```json
// vercel.json
{
  "buildCommand": "npm run build && npm run postbuild",
  "installCommand": "npm ci",
  "framework": "nextjs"
}
```

### Ignore Build Step

```json
// vercel.json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./src"
}
```

### Build Environment Variables

```json
// vercel.json
{
  "build": {
    "env": {
      "NODE_ENV": "production",
      "ANALYZE": "true"
    }
  }
}
```

---

## Deployment Hooks

### Webhook on Deploy

```bash
# Trigger deployment via webhook
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_xxx/xxx"
```

### GitHub Actions Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Monitoring & Analytics

### Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Error Tracking

```typescript
// app/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

---

## CLI Commands Reference

| Command | Description |
|---------|-------------|
| `vercel` | Deploy to preview |
| `vercel --prod` | Deploy to production |
| `vercel dev` | Run locally with Vercel features |
| `vercel env pull` | Pull env vars to .env.local |
| `vercel logs` | View deployment logs |
| `vercel inspect <url>` | Inspect deployment |
| `vercel rollback` | Rollback to previous deployment |
| `vercel promote <url>` | Promote preview to production |
| `vercel alias <url> <domain>` | Add custom alias |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check `vercel logs` for errors |
| Environment variables not working | Ensure correct environment type (Production/Preview/Development) |
| Middleware not running | Check `matcher` config in middleware.ts |
| ISR not revalidating | Verify revalidation endpoint and secret |
| 404 on dynamic routes | Check `generateStaticParams` or use `dynamic = 'force-dynamic'` |
| Large bundle size | Enable `experimental.optimizePackageImports` in next.config.js |
