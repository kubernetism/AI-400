# React 19 & Next.js 15+ Patterns

## Overview

React 19 and Next.js 15+ introduce significant improvements for building modern web applications, including the `use()` hook, Actions, improved Suspense, Server Components, and Partial Prerendering.

---

## Server Components vs Client Components

### Decision Tree

```
Is the component...
├── Using state (useState, useReducer)?          → Client Component
├── Using effects (useEffect, useLayoutEffect)?  → Client Component
├── Using browser APIs (window, document)?       → Client Component
├── Using event handlers (onClick, onChange)?    → Client Component
├── Using React hooks that require client?       → Client Component
├── Accessing backend resources directly?        → Server Component ✓
├── Fetching data?                               → Server Component ✓
├── Only rendering static content?               → Server Component ✓
└── Default in App Router                        → Server Component ✓
```

### Server Component (Default)

```tsx
// app/products/page.tsx
// This is a Server Component by default - no 'use client' directive

import { db } from '@/lib/db'
import { ProductCard } from '@/components/product-card'

export default async function ProductsPage() {
  // Direct database access - no API needed
  const products = await db.product.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### Client Component

```tsx
// components/add-to-cart-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { addToCart } from '@/lib/actions'

export function AddToCartButton({ productId }: { productId: string }) {
  const [isAdding, setIsAdding] = useState(false)

  async function handleClick() {
    setIsAdding(true)
    await addToCart(productId)
    setIsAdding(false)
  }

  return (
    <Button onClick={handleClick} disabled={isAdding}>
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </Button>
  )
}
```

### Composing Server and Client Components

```tsx
// app/products/[id]/page.tsx (Server Component)
import { db } from '@/lib/db'
import { AddToCartButton } from '@/components/add-to-cart-button'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
  })

  if (!product) {
    notFound()
  }

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>${product.price}</p>
      {/* Client Component nested in Server Component */}
      <AddToCartButton productId={product.id} />
    </div>
  )
}
```

---

## React 19 Features

### use() Hook

Read promises and context directly in components.

```tsx
import { use } from 'react'

// Reading a promise
function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise)

  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>{comment.text}</li>
      ))}
    </ul>
  )
}

// Reading context conditionally
function ConditionalTheme({ showTheme }: { showTheme: boolean }) {
  if (showTheme) {
    const theme = use(ThemeContext)
    return <div style={{ color: theme.primary }}>Themed content</div>
  }
  return <div>Default content</div>
}

// Usage with Suspense
function CommentsSection({ postId }: { postId: string }) {
  const commentsPromise = fetchComments(postId)

  return (
    <Suspense fallback={<CommentsSkeleton />}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  )
}
```

### Actions with useActionState

```tsx
'use client'

import { useActionState } from 'react'
import { createPost } from '@/lib/actions'

interface FormState {
  message: string
  errors?: {
    title?: string[]
    content?: string[]
  }
}

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createPost,
    { message: '' }
  )

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          required
          aria-describedby={state.errors?.title ? 'title-error' : undefined}
        />
        {state.errors?.title && (
          <p id="title-error" className="text-destructive text-sm">
            {state.errors.title[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          required
          aria-describedby={state.errors?.content ? 'content-error' : undefined}
        />
        {state.errors?.content && (
          <p id="content-error" className="text-destructive text-sm">
            {state.errors.content[0]}
          </p>
        )}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>

      {state.message && (
        <p aria-live="polite">{state.message}</p>
      )}
    </form>
  )
}
```

### useFormStatus

```tsx
'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending && <Spinner size="sm" className="mr-2" />}
      {pending ? 'Submitting...' : children}
    </Button>
  )
}

export function ContactForm() {
  return (
    <form action={submitContact}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      <SubmitButton>Send Message</SubmitButton>
    </form>
  )
}
```

### useOptimistic

```tsx
'use client'

import { useOptimistic } from 'react'
import { addTodo } from '@/lib/actions'

interface Todo {
  id: string
  text: string
  pending?: boolean
}

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: string) => [
      ...state,
      { id: crypto.randomUUID(), text: newTodo, pending: true },
    ]
  )

  async function handleSubmit(formData: FormData) {
    const text = formData.get('text') as string
    addOptimisticTodo(text)
    await addTodo(text)
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input name="text" required />
        <button type="submit">Add</button>
      </form>

      <ul>
        {optimisticTodos.map((todo) => (
          <li
            key={todo.id}
            className={todo.pending ? 'opacity-50' : ''}
          >
            {todo.text}
            {todo.pending && ' (saving...)'}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Next.js 15+ App Router Patterns

### File-Based Routing

```
app/
├── layout.tsx           # Root layout (required)
├── page.tsx             # Home page (/)
├── loading.tsx          # Loading UI
├── error.tsx            # Error UI
├── not-found.tsx        # 404 UI
├── products/
│   ├── page.tsx         # /products
│   └── [id]/
│       ├── page.tsx     # /products/123
│       └── loading.tsx  # Loading for this route
├── (marketing)/         # Route group (no URL segment)
│   ├── layout.tsx       # Marketing layout
│   ├── about/
│   │   └── page.tsx     # /about
│   └── contact/
│       └── page.tsx     # /contact
└── (dashboard)/         # Another route group
    ├── layout.tsx       # Dashboard layout
    └── settings/
        └── page.tsx     # /settings
```

### Parallel Routes

Render multiple pages in the same layout simultaneously.

```
app/
├── @modal/
│   ├── default.tsx      # Default when no modal
│   └── login/
│       └── page.tsx     # /login (as modal)
├── @sidebar/
│   └── page.tsx         # Sidebar content
├── layout.tsx           # Renders both slots
└── page.tsx             # Main content
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  modal,
  sidebar,
}: {
  children: React.ReactNode
  modal: React.ReactNode
  sidebar: React.ReactNode
}) {
  return (
    <div className="flex">
      <aside className="w-64">{sidebar}</aside>
      <main className="flex-1">
        {children}
        {modal}
      </main>
    </div>
  )
}
```

### Intercepting Routes

Intercept a route to show it in a different context (e.g., modal).

```
app/
├── feed/
│   └── page.tsx                    # Feed page
├── @modal/
│   └── (.)photo/[id]/              # Intercepts /photo/[id]
│       └── page.tsx                # Shows photo in modal
└── photo/[id]/
    └── page.tsx                    # Direct navigation target
```

```tsx
// app/@modal/(.)photo/[id]/page.tsx
import { Modal } from '@/components/modal'
import { getPhoto } from '@/lib/api'

export default async function PhotoModal({ params }: { params: { id: string } }) {
  const photo = await getPhoto(params.id)

  return (
    <Modal>
      <img src={photo.url} alt={photo.title} />
      <p>{photo.description}</p>
    </Modal>
  )
}
```

### Route Groups

Organize routes without affecting URL structure.

```tsx
// app/(marketing)/layout.tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}

// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
```

---

## Server Actions

### Basic Form Handling

```tsx
// lib/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const PostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(10, 'Content must be at least 10 characters'),
})

export async function createPost(prevState: any, formData: FormData) {
  const validatedFields = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed',
    }
  }

  const { title, content } = validatedFields.data

  try {
    await db.post.create({
      data: { title, content },
    })
  } catch (error) {
    return { message: 'Failed to create post' }
  }

  revalidatePath('/posts')
  redirect('/posts')
}
```

### Server Action with Direct Call

```tsx
// components/like-button.tsx
'use client'

import { useState } from 'react'
import { likePost } from '@/lib/actions'

export function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiking, setIsLiking] = useState(false)

  async function handleLike() {
    setIsLiking(true)
    setLikes((prev) => prev + 1) // Optimistic update

    try {
      await likePost(postId)
    } catch {
      setLikes((prev) => prev - 1) // Revert on error
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <button onClick={handleLike} disabled={isLiking}>
      ❤️ {likes}
    </button>
  )
}
```

---

## Streaming & Partial Prerendering

### Streaming with loading.tsx

```tsx
// app/dashboard/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}
```

### Suspense Boundaries

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { StatsSkeleton, ChartSkeleton, TableSkeleton } from '@/components/skeletons'
import { Stats, RevenueChart, RecentOrders } from '@/components/dashboard'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats load first - smallest data */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      {/* Chart loads next */}
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      {/* Table loads last - most data */}
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  )
}
```

### Partial Prerendering (PPR)

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: {
    ppr: true,
  },
}

export default config
```

```tsx
// app/page.tsx
import { Suspense } from 'react'

export default function HomePage() {
  return (
    <>
      {/* Static shell - prerendered at build time */}
      <Header />
      <Hero />

      {/* Dynamic content - streamed at request time */}
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      {/* Static footer - prerendered */}
      <Footer />
    </>
  )
}
```

---

## Data Fetching Patterns

### Fetch with Caching

```tsx
// lib/api.ts

// Cached indefinitely (default)
export async function getProducts() {
  const res = await fetch('https://api.example.com/products')
  return res.json()
}

// Revalidate every hour
export async function getProductsWithRevalidation() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 },
  })
  return res.json()
}

// No caching
export async function getProductsDynamic() {
  const res = await fetch('https://api.example.com/products', {
    cache: 'no-store',
  })
  return res.json()
}

// With tags for on-demand revalidation
export async function getProductsWithTags() {
  const res = await fetch('https://api.example.com/products', {
    next: { tags: ['products'] },
  })
  return res.json()
}
```

### Parallel Data Fetching

```tsx
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // Fetch in parallel
  const [stats, orders, users] = await Promise.all([
    getStats(),
    getRecentOrders(),
    getTopUsers(),
  ])

  return (
    <div>
      <StatsCards stats={stats} />
      <OrdersTable orders={orders} />
      <UsersList users={users} />
    </div>
  )
}
```

### Sequential Data Fetching (When Needed)

```tsx
// app/profile/[username]/page.tsx
export default async function ProfilePage({
  params,
}: {
  params: { username: string }
}) {
  // First fetch user
  const user = await getUser(params.username)

  // Then fetch user's posts (depends on user.id)
  const posts = await getUserPosts(user.id)

  return (
    <div>
      <UserProfile user={user} />
      <PostsList posts={posts} />
    </div>
  )
}
```

---

## Metadata & SEO

### Static Metadata

```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | My App',
    default: 'My App',
  },
  description: 'A modern web application',
  openGraph: {
    title: 'My App',
    description: 'A modern web application',
    url: 'https://myapp.com',
    siteName: 'My App',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My App',
    description: 'A modern web application',
    images: ['/og.png'],
  },
}
```

### Dynamic Metadata

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from 'next'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id)

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id)
  return <ProductDetails product={product} />
}
```

---

## Error Handling

### Error Boundary

```tsx
// app/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

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
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">
        {error.message || 'An unexpected error occurred'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

### Not Found

```tsx
// app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}
```

---

## Performance Patterns

### Image Optimization

```tsx
import Image from 'next/image'

export function ProductImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-square">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover rounded-lg"
        priority={false}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      />
    </div>
  )
}
```

### Font Optimization

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### Dynamic Imports

```tsx
import dynamic from 'next/dynamic'

// Load heavy component only when needed
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Disable SSR for client-only components
})

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart />
    </div>
  )
}
```
