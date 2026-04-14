# shadcn/ui Complete Guide

A comprehensive guide to installing, styling, and using shadcn/ui components in your React projects.

---

## Table of Contents

1. [What is shadcn/ui?](#what-is-shadcnui)
2. [Adding Components](#adding-components)
3. [Styling Components](#styling-components)
4. [Using Components](#using-components)
5. [Best Practices](#best-practices)

---

## What is shadcn/ui?

**shadcn/ui** is a collection of beautifully designed, accessible React components built with:
- **Radix UI** — Unstyled, accessible component primitives
- **Tailwind CSS** — Utility-first CSS for styling
- **TypeScript** — Full type safety

Unlike traditional component libraries, shadcn/ui components are **copied directly into your project**, giving you complete control over styling and behavior. You own the code, not a dependency.

### Key Benefits
✓ Fully customizable  
✓ Copy-paste components  
✓ Built on proven libraries (Radix UI, Tailwind)  
✓ Dark mode support out of the box  
✓ TypeScript support  
✓ Production-ready  

---

## Adding Components

### Method 1: Using the CLI (Recommended)

The easiest way to add components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
```

This automatically:
- Downloads the component code
- Places it in `components/ui`
- Installs peer dependencies
- Generates TypeScript types

### Method 2: Add Multiple Components at Once

```bash
npx shadcn-ui@latest add button card input dropdown-menu
```

### Method 3: Add All Components

```bash
npx shadcn-ui@latest add -a
```

### Method 4: Manual Copy-Paste (Advanced)

If you want manual control:
1. Visit [shadcn/ui documentation](https://ui.shadcn.com)
2. Find your component
3. Copy the code
4. Paste it into `components/ui/your-component.tsx`

### Viewing Available Components

```bash
npx shadcn-ui@latest list
```

This shows all available components you can add.

---

## Styling Components

### Understanding Tailwind CSS Classes

shadcn/ui components use Tailwind CSS utilities. Styling happens through class names:

```typescript
import { Button } from '@/components/ui/button'

export default function Example() {
  return (
    <Button 
      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-lg"
    >
      Styled Button
    </Button>
  )
}
```

### Common Tailwind Classes for Styling

| Property | Classes |
|----------|---------|
| **Size** | `w-full`, `w-80`, `px-4`, `py-2` |
| **Colors** | `bg-blue-500`, `text-white`, `border-red-300` |
| **Layout** | `flex`, `grid`, `gap-4`, `space-y-2` |
| **Typography** | `text-lg`, `font-bold`, `text-center` |
| **Effects** | `shadow-lg`, `rounded-lg`, `opacity-50` |
| **Responsive** | `md:w-1/2`, `lg:flex`, `sm:text-sm` |

### Modifier Props

Components accept size, variant, and state props:

```typescript
import { Button } from '@/components/ui/button'

export default function ButtonVariants() {
  return (
    <>
      {/* Size */}
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>

      {/* Variant */}
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>

      {/* Disabled State */}
      <Button disabled>Disabled</Button>
    </>
  )
}
```

### Customizing Component CSS

Each component has internal CSS you can modify. For example, `components/ui/button.tsx`:

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**To customize**, modify the `cva` variants directly in the component file.

### Using CSS Variables for Theming

shadcn/ui uses CSS variables for dark mode and theming. Update your `index.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    /* ... other variables ... */
  }

  .dark {
    --background: 0 0% 3.6%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    /* ... other variables ... */
  }
}

@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## Using Components

### Basic Button Example

```typescript
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const handleClick = () => {
    alert('Button clicked!')
  }

  return (
    <div className="flex gap-4">
      <Button onClick={handleClick}>Click Me</Button>
      <Button variant="outline">Outline Button</Button>
      <Button disabled>Disabled Button</Button>
    </div>
  )
}
```

### Form with Input and Button

First, add the Input component:

```bash
npx shadcn-ui@latest add input
```

Then use it:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ContactForm() {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Email:', email)
    setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" className="w-full">
        Subscribe
      </Button>
    </form>
  )
}
```

### Card Component

Add the Card component:

```bash
npx shadcn-ui@latest add card
```

Use it:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ProductCard() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Premium Plan</CardTitle>
        <CardDescription>Get full access to all features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Includes: Advanced analytics, priority support, custom integrations
        </p>
        <Button className="w-full">Get Started</Button>
      </CardContent>
    </Card>
  )
}
```

### Dialog (Modal) Example

Add Dialog:

```bash
npx shadcn-ui@latest add dialog
```

Use it:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function ModalExample() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Dropdown Menu Example

Add Dropdown Menu:

```bash
npx shadcn-ui@latest add dropdown-menu
```

Use it:

```typescript
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function MenuExample() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## Best Practices

### 1. Use TypeScript

Always leverage TypeScript for type safety:

```typescript
import { Button } from '@/components/ui/button'
import React from 'react'

interface MyButtonProps extends React.ComponentProps<typeof Button> {
  label: string
}

export default function MyButton({ label, ...props }: MyButtonProps) {
  return <Button {...props}>{label}</Button>
}
```

### 2. Keep Components Small and Focused

```typescript
// ❌ Bad: Too much in one component
function UserProfile() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>User</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Lots of complex logic */}
        </CardContent>
      </Card>
    </div>
  )
}

// ✅ Good: Separate concerns
function UserProfileCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <UserInfo user={user} />
      </CardContent>
    </Card>
  )
}
```

### 3. Compose Components

Build complex UIs by combining simple components:

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>$12,345</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>1,234</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Growth</CardTitle>
        </CardHeader>
        <CardContent>+23%</CardContent>
      </Card>
    </div>
  )
}
```

### 4. Respect Component Props

Always use the component's exported props and variants:

```typescript
// ✅ Good: Use provided variants
<Button variant="destructive" size="lg">Delete</Button>

// ❌ Bad: Don't override the entire styling
<Button className="bg-red-600 text-xl px-10 py-5">Delete</Button>
```

### 5. Dark Mode Support

shadcn/ui components support dark mode automatically. Enable it in your layout:

```typescript
'use client'

import { useEffect, useState } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true)
    }
  }, [])

  return (
    <html className={isDark ? 'dark' : ''}>
      <body>{children}</body>
    </html>
  )
}
```

### 6. Accessibility Matters

shadcn/ui is built on Radix UI, which is accessible by default. Don't break it:

```typescript
// ✅ Good: Let Radix handle accessibility
<Button onClick={handleClick}>Click me</Button>

// ❌ Bad: Don't remove semantic HTML
<div onClick={handleClick} className="bg-blue-500 text-white p-2">
  Click me
</div>
```

### 7. Use Responsive Classes

Design for mobile first:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
  <Card>Card 4</Card>
</div>
```

---

## Troubleshooting

### Components Not Showing Styles

**Problem**: Components appear unstyled.

**Solution**: 
- Ensure Tailwind CSS is installed and configured
- Check `tailwind.config.ts` includes your component paths
- Verify `globals.css` imports Tailwind directives:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

### Missing Dependencies

**Problem**: Import errors for missing modules.

**Solution**: 
```bash
npm install
npx shadcn-ui@latest add [component-name]
```

### Dark Mode Not Working

**Problem**: Dark mode styles don't apply.

**Solution**: 
- Add `darkMode: ["class"]` to `tailwind.config.ts`
- Ensure your HTML root element has the `dark` class when dark mode is active

---

## Resources

- **Official Docs**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com
- **GitHub**: https://github.com/shadcn-ui/ui
- **Component Showcase**: https://ui.shadcn.com/blocks

---

## Quick Command Reference

```bash
# Initialize shadcn/ui in your project
npx shadcn-ui@latest init

# Add a single component
npx shadcn-ui@latest add button

# Add multiple components
npx shadcn-ui@latest add button card input dropdown-menu

# List all available components
npx shadcn-ui@latest list

# Add all components
npx shadcn-ui@latest add -a
```

---

**Happy building! 🚀**