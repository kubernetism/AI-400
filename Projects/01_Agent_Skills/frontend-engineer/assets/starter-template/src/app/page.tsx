import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Next.js + shadcn/ui Starter
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          A modern, accessible, and performant starter template built with Next.js 15,
          React 19, TypeScript, Tailwind CSS, and shadcn/ui components.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </main>
  )
}
