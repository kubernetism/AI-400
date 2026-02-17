# UI/UX Standards (2025-2026)

## Overview

Modern UI/UX design emphasizes calmness, inclusivity, and clarity. Interfaces adopt larger typography, softer edges, increased spacing, and thoughtful color contrast for improved readability and aesthetic appeal.

---

## AI-Driven Design & GenUI

### Generative UI Concepts

GenUI rebuilds interfaces in real-time based on user intent, focusing on what the user is trying to accomplish rather than a fixed navigation path.

```tsx
// Dynamic component rendering based on context
interface AIRecommendation {
  type: 'product' | 'article' | 'action'
  props: Record<string, unknown>
  priority: number
}

const componentMap = {
  product: ProductCard,
  article: ArticleCard,
  action: ActionButton,
}

export function AdaptiveLayout({
  recommendations,
}: {
  recommendations: AIRecommendation[]
}) {
  const sortedComponents = useMemo(
    () => [...recommendations].sort((a, b) => b.priority - a.priority),
    [recommendations]
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedComponents.map((rec, i) => {
        const Component = componentMap[rec.type]
        return <Component key={i} {...rec.props} />
      })}
    </div>
  )
}
```

### Personalization Patterns

```tsx
// User preference-aware component
export function PersonalizedHero({ user }: { user: User }) {
  const timeOfDay = getTimeOfDay()
  const greeting = getGreeting(timeOfDay, user.name)

  return (
    <section className="py-16">
      <h1 className="text-4xl font-bold">{greeting}</h1>
      <p className="text-muted-foreground">
        {user.lastAction
          ? `Continue where you left off with ${user.lastAction}`
          : 'What would you like to do today?'}
      </p>
    </section>
  )
}
```

---

## Bento Grid Layouts

Modern modular layout where content is arranged in blocks of different sizes, creating dynamic visual rhythm.

### Basic Bento Grid

```tsx
import { cn } from '@/lib/utils'

interface BentoCardProps {
  children: React.ReactNode
  colSpan?: 1 | 2
  rowSpan?: 1 | 2
  className?: string
}

export function BentoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  )
}

export function BentoCard({
  children,
  colSpan = 1,
  rowSpan = 1,
  className,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card p-6 shadow-sm border',
        'transition-shadow hover:shadow-md',
        colSpan === 2 && 'md:col-span-2',
        rowSpan === 2 && 'md:row-span-2',
        className
      )}
    >
      {children}
    </div>
  )
}
```

### Dashboard Example

```tsx
export function DashboardBento() {
  return (
    <BentoGrid>
      {/* Large stats card */}
      <BentoCard colSpan={2} rowSpan={2}>
        <RevenueChart />
      </BentoCard>

      {/* Small stat cards */}
      <BentoCard>
        <StatCard title="Users" value="12,345" change="+12%" />
      </BentoCard>
      <BentoCard>
        <StatCard title="Orders" value="1,234" change="+8%" />
      </BentoCard>

      {/* Wide activity card */}
      <BentoCard colSpan={2}>
        <ActivityFeed />
      </BentoCard>

      {/* Regular cards */}
      <BentoCard>
        <QuickActions />
      </BentoCard>
      <BentoCard>
        <Notifications />
      </BentoCard>
    </BentoGrid>
  )
}
```

---

## Soft UI / Neumorphism 2.0

Modern subtle approach that gives digital elements a 3D vibe while remaining usable.

### Tailwind Config Extension

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      boxShadow: {
        'soft': '0 4px 6px -1px rgb(0 0 0 / 0.05), inset 0 1px 0 rgb(255 255 255 / 0.1)',
        'soft-lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), inset 0 1px 0 rgb(255 255 255 / 0.1)',
        'soft-inset': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'soft-raised': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), inset 0 1px 0 rgb(255 255 255 / 0.15)',
      },
    },
  },
} satisfies Config
```

### Soft Card Component

```tsx
export function SoftCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-card to-muted p-6 shadow-soft">
      {children}
    </div>
  )
}

export function SoftButton({ children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-xl px-6 py-3',
        'bg-gradient-to-br from-primary/90 to-primary',
        'shadow-soft-raised',
        'transition-all duration-200',
        'hover:shadow-soft-lg hover:translate-y-[-1px]',
        'active:shadow-soft-inset active:translate-y-0'
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

---

## WCAG 2.1 Level AA Compliance

**Required by April 2026** for public sector entities in the U.S.

### Color Contrast Requirements

| Element | Minimum Ratio |
|---------|---------------|
| Normal text (< 18px) | 4.5:1 |
| Large text (>= 18px bold or >= 24px) | 3:1 |
| UI components & graphics | 3:1 |

### Contrast Checker Utility

```typescript
// lib/accessibility.ts
export function getContrastRatio(
  foreground: string,
  background: string
): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex)
    const [r, g, b] = rgb.map((c) => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsWCAG(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}
```

### Keyboard Navigation

```tsx
// Focus management for modals
export function AccessibleModal({
  isOpen,
  onClose,
  children,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      modalRef.current?.focus()
    } else {
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  // Trap focus inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }

    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusableElements?.length) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg p-6 shadow-lg">
        {children}
      </div>
    </div>
  )
}
```

### Skip Links

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
```

---

## Cognitive Accessibility

### ADHD-Friendly Design

```tsx
// Break content into digestible chunks
export function ChunkedContent({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-8">
      {sections.map((section, i) => (
        <section key={i} className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
          <div className="prose prose-sm">{section.content}</div>
        </section>
      ))}
    </div>
  )
}

// Clear progress indicators
export function ProgressSteps({ steps, currentStep }: ProgressProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                i < currentStep && 'bg-primary text-primary-foreground',
                i === currentStep && 'bg-primary/20 text-primary border-2 border-primary',
                i > currentStep && 'bg-muted text-muted-foreground'
              )}
            >
              {i < currentStep ? '✓' : i + 1}
            </span>
            <span className={cn(
              'text-sm',
              i === currentStep ? 'font-medium' : 'text-muted-foreground'
            )}>
              {step}
            </span>
            {i < steps.length - 1 && (
              <div className="h-px w-8 bg-border" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
```

### Autism-Friendly Patterns

```tsx
// Predictable, consistent layouts
export function ConsistentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Always same navigation position */}
      <Header className="sticky top-0" />

      {/* Consistent content area */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Always same footer position */}
      <Footer />
    </div>
  )
}

// Clear, literal language in UI
const BUTTON_LABELS = {
  save: 'Save changes',      // Not "Submit" or "Done"
  cancel: 'Cancel changes',  // Not "Go back" or "Nevermind"
  delete: 'Delete item',     // Not "Remove" or "Clear"
}
```

### Dyslexia-Friendly Typography

```css
/* globals.css */
.dyslexia-friendly {
  font-family: 'OpenDyslexic', 'Lexie Readable', -apple-system, sans-serif;
  line-height: 1.8;
  letter-spacing: 0.05em;
  word-spacing: 0.1em;
}

/* Avoid justified text */
.prose {
  text-align: left;
}

/* Adequate line length */
.max-readable {
  max-width: 65ch;
}
```

```tsx
// User preference toggle
export function AccessibilitySettings() {
  const [dyslexiaMode, setDyslexiaMode] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dyslexia-friendly', dyslexiaMode)
  }, [dyslexiaMode])

  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="dyslexia-mode">Dyslexia-friendly font</Label>
      <Switch
        id="dyslexia-mode"
        checked={dyslexiaMode}
        onCheckedChange={setDyslexiaMode}
      />
    </div>
  )
}
```

---

## Functional Motion Design

Motion should provide functional logic, not just flair. Use transitions to confirm actions and mask latency.

### Purposeful Animation with Framer Motion

```tsx
import { motion, AnimatePresence } from 'framer-motion'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export function AnimatedList({ items }: { items: Item[] }) {
  return (
    <AnimatePresence mode="popLayout">
      {items.map((item) => (
        <motion.div
          key={item.id}
          {...fadeInUp}
          layout
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <ItemCard item={item} />
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
```

### Respecting User Preferences

```tsx
import { useReducedMotion } from 'framer-motion'

export function AnimatedComponent({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  )
}
```

### CSS-based Motion with Reduced Motion

```css
/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Safe motion that respects preference */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .animate-fade-in {
    animation: none;
    opacity: 1;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## Outcome-Driven Design

Focus on measurable goals, not just aesthetics.

### Goal-Oriented Component Design

```tsx
// Goal: User completes checkout quickly
export function OptimizedCheckout() {
  const { step, progress, canProceed, errors } = useCheckout()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Clear progress indicator */}
      <ProgressSteps
        steps={['Cart', 'Shipping', 'Payment', 'Confirm']}
        currentStep={step}
      />

      {/* Single-column form for focus */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {step === 0 && <CartReview />}
            {step === 1 && <ShippingForm />}
            {step === 2 && <PaymentForm />}
            {step === 3 && <OrderConfirmation />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Always visible navigation */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={step === 0}
        >
          Back
        </Button>
        <Button
          onClick={proceed}
          disabled={!canProceed}
        >
          {step === 3 ? 'Place Order' : 'Continue'}
        </Button>
      </div>

      {/* Error summary for quick fixing */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Please fix the following:</AlertTitle>
          <ul className="list-disc pl-4">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  )
}
```

### Conversion-Focused Patterns

```tsx
// Clear value proposition
export function HeroSection() {
  return (
    <section className="py-20 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Ship faster with modern tools
      </h1>
      <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
        Build production-ready applications in hours, not weeks.
      </p>

      {/* Single, clear CTA */}
      <div className="mt-8">
        <Button size="lg" className="px-8">
          Start Building Free
        </Button>
      </div>

      {/* Social proof */}
      <p className="mt-4 text-sm text-muted-foreground">
        Trusted by 10,000+ developers worldwide
      </p>
    </section>
  )
}
```

---

## Accessibility Testing Checklist

### Automated Testing

```bash
# Install axe-core for React
npm install @axe-core/react --save-dev
```

```tsx
// Enable in development
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000)
  })
}
```

### Manual Testing Checklist

- [ ] Navigate entire app using only keyboard
- [ ] Test with screen reader (VoiceOver, NVDA, JAWS)
- [ ] Verify focus indicators are visible
- [ ] Check color contrast with browser DevTools
- [ ] Test at 200% zoom without content loss
- [ ] Verify all images have alt text
- [ ] Check form error messages are announced
- [ ] Test with `prefers-reduced-motion: reduce`
- [ ] Verify skip links work correctly
- [ ] Check heading hierarchy (h1 → h2 → h3)
