import { Button } from "@/components/ui/button"

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-balance font-bold tracking-tight">
        Project Homepage
      </h1>

      <div className="flex flex-wrap justify-center gap-4">
        {/* Testing all Shadcn Button Variants */}
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </main>
  )
}

export default App