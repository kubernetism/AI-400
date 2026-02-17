# shadcn/ui Patterns & Ecosystem (2025-2026)

## Overview

shadcn/ui is a collection of beautifully-designed, accessible components built with Radix UI and Tailwind CSS. Unlike traditional component libraries, shadcn provides copy-paste code that you own and control.

**Key Principles:**
- **Open Code**: Top layer of component code is open for modification
- **Composition**: Common, composable interface across all components
- **AI-Ready**: Open code for LLMs to read, understand, and improve

---

## New Components (2025-2026)

### Field Component

Combines label, input, description, and error message into a cohesive unit with automatic ARIA attributes.

```tsx
import {
  Field,
  FieldLabel,
  FieldInput,
  FieldDescription,
  FieldError
} from "@/components/ui/field"

export function EmailField() {
  return (
    <Field>
      <FieldLabel>Email Address</FieldLabel>
      <FieldInput type="email" placeholder="you@example.com" />
      <FieldDescription>We'll never share your email.</FieldDescription>
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  )
}
```

### Input Group

Combines input with prefix/suffix elements for search bars, currency inputs, etc.

```tsx
import { InputGroup, InputGroupText, InputGroupInput } from "@/components/ui/input-group"
import { Search, DollarSign } from "lucide-react"

// Search input with icon
<InputGroup>
  <InputGroupText>
    <Search className="h-4 w-4" />
  </InputGroupText>
  <InputGroupInput placeholder="Search..." />
</InputGroup>

// Currency input
<InputGroup>
  <InputGroupText>
    <DollarSign className="h-4 w-4" />
  </InputGroupText>
  <InputGroupInput type="number" placeholder="0.00" />
</InputGroup>
```

### Button Group

Groups related buttons with proper spacing and styling.

```tsx
import { ButtonGroup } from "@/components/ui/button-group"
import { Button } from "@/components/ui/button"

<ButtonGroup>
  <Button variant="outline">Left</Button>
  <Button variant="outline">Center</Button>
  <Button variant="outline">Right</Button>
</ButtonGroup>
```

### Spinner

Loading indicator with size and color variants.

```tsx
import { Spinner } from "@/components/ui/spinner"

<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />

// In buttons
<Button disabled>
  <Spinner size="sm" className="mr-2" />
  Loading...
</Button>
```

### Kbd (Keyboard Key)

Displays keyboard shortcuts.

```tsx
import { Kbd } from "@/components/ui/kbd"

<p>Press <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> to search</p>
<p>Save with <Kbd>Cmd</Kbd> + <Kbd>S</Kbd></p>
```

### Item Component

Reusable list item with icon, text, and action support.

```tsx
import { Item, ItemIcon, ItemContent, ItemAction } from "@/components/ui/item"
import { File, MoreHorizontal } from "lucide-react"

<Item>
  <ItemIcon>
    <File className="h-4 w-4" />
  </ItemIcon>
  <ItemContent>
    <span className="font-medium">Document.pdf</span>
    <span className="text-muted-foreground text-sm">2.4 MB</span>
  </ItemContent>
  <ItemAction>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </ItemAction>
</Item>
```

### Empty State

Placeholder for empty data states.

```tsx
import { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyAction } from "@/components/ui/empty"
import { Inbox } from "lucide-react"

<Empty>
  <EmptyIcon>
    <Inbox className="h-12 w-12" />
  </EmptyIcon>
  <EmptyTitle>No messages</EmptyTitle>
  <EmptyDescription>
    You don't have any messages yet. Start a conversation!
  </EmptyDescription>
  <EmptyAction>
    <Button>Compose Message</Button>
  </EmptyAction>
</Empty>
```

---

## Ecosystem Libraries

### Origin UI (400+ Components)

The most comprehensive free shadcn component library.

```bash
# Install components from Origin UI
npx originui add button
npx originui add card
```

**Categories:** Buttons, Cards, Forms, Navigation, Data Display, Feedback, Overlays, Layout

### TanCN

TanStack integration with shadcn styling.

```tsx
// Data table with TanCN
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"

export function UsersTable({ data }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="email"
      pagination
    />
  )
}
```

**Features:** TanStack Table, TanStack Query integration, sorting, filtering, pagination

### FormCN

Advanced form components with validation.

```tsx
// Multi-step form
import { MultiStepForm, Step } from "@/components/ui/multi-step-form"

<MultiStepForm onComplete={handleSubmit}>
  <Step title="Personal Info">
    <PersonalInfoFields />
  </Step>
  <Step title="Address">
    <AddressFields />
  </Step>
  <Step title="Review">
    <ReviewStep />
  </Step>
</MultiStepForm>
```

### Cult-UI

Creative/artistic component variants for marketing sites.

**Features:** Animated components, unique layouts, gradient effects, glassmorphism

### Shadcnblocks

Pre-built page sections (1100+ blocks).

**Categories:** Hero sections, Pricing tables, Feature grids, Testimonials, CTAs, Footers

---

## Form Validation Patterns

### React Hook Form + Zod

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

type FormValues = z.infer<typeof formSchema>

export function SignupForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: FormValues) {
    // Handle submission
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>
    </Form>
  )
}
```

### Form with Server Action

```tsx
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createUser } from '@/lib/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create User'}
    </Button>
  )
}

export function CreateUserForm() {
  const [state, formAction] = useActionState(createUser, null)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
        {state?.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        {state?.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email}</p>
        )}
      </div>

      <SubmitButton />

      {state?.message && (
        <p className="text-sm text-muted-foreground">{state.message}</p>
      )}
    </form>
  )
}
```

---

## Component Organization

### Domain Grouping (Recommended)

```
components/
├── auth/                    # Authentication components
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   └── password-reset.tsx
├── dashboard/               # Dashboard-specific
│   ├── stats-card.tsx
│   ├── activity-feed.tsx
│   └── quick-actions.tsx
├── commerce/                # E-commerce components
│   ├── product-card.tsx
│   ├── cart-item.tsx
│   └── checkout-form.tsx
├── ui/                      # shadcn/ui base components
│   ├── button.tsx
│   ├── input.tsx
│   └── dialog.tsx
└── shared/                  # Truly reusable components
    ├── page-header.tsx
    ├── data-table.tsx
    └── empty-state.tsx
```

---

## AI-Ready Features & v0 Integration

### Using v0.dev

1. Describe component in plain language on v0.dev
2. Generate shadcn-compatible code
3. Export to your project
4. Customize with Tailwind variants
5. Add accessibility attributes

### Copy Prompt Pattern

```tsx
// Component with AI-friendly structure
/**
 * ProductCard - Displays a product with image, title, price, and add-to-cart button
 *
 * @example
 * <ProductCard
 *   title="Wireless Headphones"
 *   price={99.99}
 *   image="/headphones.jpg"
 *   onAddToCart={() => addToCart(productId)}
 * />
 */
export function ProductCard({ title, price, image, onAddToCart }: ProductCardProps) {
  return (
    <Card>
      <CardImage src={image} alt={title} />
      <CardContent>
        <CardTitle>{title}</CardTitle>
        <CardPrice>${price.toFixed(2)}</CardPrice>
      </CardContent>
      <CardFooter>
        <Button onClick={onAddToCart}>Add to Cart</Button>
      </CardFooter>
    </Card>
  )
}
```

---

## Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible (ring-2 ring-ring)
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for UI)
- [ ] Screen reader labels present (aria-label, sr-only class)
- [ ] Form fields have associated labels
- [ ] Error messages are announced (role="alert")
- [ ] Loading states are announced (aria-live="polite")
- [ ] Dialogs trap focus and return focus on close
- [ ] Images have alt text
- [ ] Skip links for navigation

### Accessible Dialog Example

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

export function ConfirmDialog({ title, description, onConfirm }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Theming

### CSS Variables

```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode values */
  }
}
```

### Dynamic Theme Switching

```tsx
'use client'

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```
