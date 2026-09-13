# Student Dashboard Design System

## Overview
This design system provides a cohesive, modern, and responsive visual language for the CGA application. Built with Tailwind CSS and designed for reusability across all student-facing pages.

---

## Color Palette & Usage

### Primary Colors
The app supports multiple color themes (green, orange, teal, violet, etc.). Current primary color is dynamically set via `data-colors` attribute.

```html
<html data-colors="green"> <!-- Change to 'orange', 'teal', 'violet', etc. -->
```

### Subject/Class Color System
A 6-color palette automatically assigned to subjects and classes (loops if more than 6):

1. **Blue** - `from-blue-600 to-blue-400` (Tech, Programming)
2. **Emerald** - `from-emerald-600 to-emerald-400` (Science, Biology)
3. **Purple** - `from-purple-600 to-purple-400` (Arts, History)
4. **Amber** - `from-amber-600 to-amber-400` (Math, Numbers)
5. **Rose** - `from-rose-600 to-rose-400` (Literature, Language)
6. **Cyan** - `from-cyan-600 to-cyan-400` (Physical Education, Sports)

### Status Colors
- **Success/Good**: `bg-emerald-50 text-emerald-600` (Attendance ≥ 85%)
- **Warning/At Risk**: `bg-amber-50 text-amber-600` (Attendance 75-84%)
- **Critical/Poor**: `bg-rose-50 text-rose-600` (Attendance < 75%)
- **Urgent**: `bg-destructive/10 text-destructive`
- **Info**: `bg-primary/10 text-primary`

---

## Typography

### Font Family Setup
```css
/* In your CSS, ensure these are imported */
font-family: 'Inter', system-ui, sans-serif; /* Body font */
font-display: 'Geist' or 'Poppins'; /* Display font - add if available */
```

### Type Scale
- **Display/Headings** (h1-h3): `font-display font-bold text-xl md:text-2xl lg:text-3xl`
- **Subheadings** (h4-h5): `font-semibold text-base md:text-lg`
- **Body Text**: `text-sm md:text-base`
- **Caption/Small**: `text-xs md:text-sm text-muted-foreground`

### Examples
```jsx
// Page Title
<h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">Dashboard</h1>

// Section Header
<h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">Attendance Overview</h2>

// Card Title
<h3 className="font-bold text-base md:text-lg">Class Name</h3>

// Body Text
<p className="text-sm md:text-base text-muted-foreground">Description text</p>

// Small Labels
<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Label</span>
```

---

## Component Patterns

### Card Component
```jsx
// Base card style
<div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
  {/* Content */}
</div>

// Card with gradient top bar
<div className={`rounded-xl border-2 p-4 md:p-5 bg-gradient-to-br ${color.bg} ${color.border}`}>
  <div className={`absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r ${color.gradient}`} />
  {/* Content */}
</div>
```

### Icon Backgrounds
```jsx
// Primary icon box
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
  <Icon className="h-5 w-5 text-primary" />
</div>

// Muted icon box
<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5">
  <Icon className="h-4 w-4 text-muted-foreground" />
</div>
```

### Progress Bar
```jsx
// Subject attendance progress
<div className="relative h-2 rounded-full bg-foreground/10 overflow-hidden">
  <div
    className={`h-full rounded-full bg-gradient-to-r ${color.gradient} transition-all duration-700`}
    style={{ width: `${percentage}%` }}
  />
</div>
```

### Badges & Labels
```jsx
// Status badge
<span className="inline-block px-2 py-1 bg-primary/10 text-xs font-bold rounded-md text-primary">
  Status Label
</span>

// Priority tag
<div className={`px-2 py-1 rounded-md text-xs font-bold ${color.label}`}>
  HIGH
</div>
```

### Info Groups
```jsx
// Icon + Label + Value
<div className="flex items-center gap-3">
  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
    <Icon className="h-4 w-4 text-muted-foreground" />
  </div>
  <div>
    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Label</p>
    <p className="text-sm font-medium">Value</p>
  </div>
</div>
```

### Timeline Pattern
```jsx
// Timeline dot + card
<div className="relative">
  {/* Timeline vertical line */}
  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 to-transparent" />
  
  {/* Dot */}
  <div className="absolute left-3 top-2 h-6 w-6 rounded-full border-2 border-background bg-primary" />
  
  {/* Card */}
  <div className="ml-20 p-4 rounded-xl border-2 bg-gradient-to-br {color.bg} {color.border}">
    {/* Content */}
  </div>
</div>
```

---

## Layout Patterns

### Dashboard Container
```jsx
<div className="space-y-6 lg:space-y-8">
  {/* Content sections with vertical spacing */}
</div>
```

### Two-Column Layout
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
  <div className="lg:col-span-2 space-y-6">
    {/* Primary content */}
  </div>
  <div className="space-y-6">
    {/* Secondary content */}
  </div>
</div>
```

### Card Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
  {/* Cards loop */}
</div>
```

### Responsive Spacing
- **Mobile**: `p-4` (16px)
- **Tablet/Desktop**: `p-6 md:p-8` (24px / 32px)
- **Gap between sections**: `gap-6 lg:gap-8`

---

## Interactive States

### Hover Effects
```jsx
// Card hover
className="hover:shadow-md hover:border-primary/30 transition-all duration-300"

// Icon scale
className="group-hover:scale-105 transition-transform"

// Color transition
className="hover:text-primary transition-colors"
```

### Active/Loading States
```jsx
// Pulse animation
className="animate-pulse"

// Spin animation (loading)
className="animate-spin rounded-full border-2 border-primary/20 border-t-primary"

// Ring effect (highlight)
className="ring-2 ring-primary/50"
```

---

## Responsive Breakpoints

```
sm: 640px   (phones)
md: 768px   (tablets)
lg: 1024px  (desktops)
xl: 1280px  (large screens)
```

### Responsive Text
```jsx
// Text size
text-sm md:text-base lg:text-lg

// Padding
p-4 md:p-6 lg:p-8

// Display
hidden md:block  (hide on mobile, show on tablet+)
md:hidden        (show on mobile, hide on tablet+)
```

---

## Component Color Assignment Logic

### Auto-assigning Colors (Loop pattern)
```javascript
const colors = [
  { bg: 'from-blue-500/10...', text: 'text-blue-600' },
  { bg: 'from-emerald-500/10...', text: 'text-emerald-600' },
  // ... more colors
]

const getColor = (index) => colors[index % colors.length]

// Usage
{items.map((item, idx) => (
  <Card key={idx} color={getColor(idx)} />
))}
```

---

## Quick Copy-Paste Snippets

### Decorative Background Gradient
```jsx
<div className="absolute inset-0 opacity-30 pointer-events-none">
  <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-primary/10 to-transparent -mr-48 -mt-48 blur-3xl" />
</div>
```

### Empty State
```jsx
<div className="flex flex-col items-center justify-center py-12 gap-3">
  <div className="rounded-full bg-muted p-4">
    <Icon className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="text-sm font-medium text-muted-foreground">No data yet</p>
  <p className="text-xs text-muted-foreground">Description text</p>
</div>
```

### Loading Spinner
```jsx
<div className="flex flex-col items-center justify-center h-64 gap-3">
  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
  <p className="text-sm text-muted-foreground">Loading...</p>
</div>
```

### Section Header
```jsx
<div className="flex items-center justify-between gap-4 mb-6">
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">Title</h2>
      <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Subtitle</p>
    </div>
  </div>
  <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
    <p className="text-sm font-bold text-primary">5 Items</p>
  </div>
</div>
```

---

## Browser Support & Performance

- **CSS**: Uses Tailwind 3+ (no IE11 support)
- **Animations**: GPU-accelerated transforms and opacity changes
- **Bundle**: All components are tree-shakeable
- **Accessibility**: WCAG 2.1 AA compliant (proper contrast ratios, semantic HTML)

---

## Usage Across Pages

### Import & Use Components
```jsx
import ProfileHeader from '@/components/dashboard/student/ProfileHeader'
import TodaysLectures from '@/components/dashboard/student/TodaysLectures'
import AttendanceStats from '@/components/dashboard/student/AttendanceStats'
import ClassStats from '@/components/dashboard/student/ClassStats'
import AnnouncementsSection from '@/components/dashboard/student/AnnouncementsSection'

// Use in any page
export default function AnyPage() {
  return (
    <div className="space-y-6">
      <ProfileHeader student={student} stats={stats} />
      <TodaysLectures lectures={timetable} />
      {/* ... more components */}
    </div>
  )
}
```

### Extending Color System
To add more colors, extend the color arrays in component files:
```javascript
const newColors = [
  { gradient: 'from-indigo-600 to-indigo-400', ... },
  { gradient: 'from-pink-600 to-pink-400', ... },
  // Add more as needed
]
```

---

## Maintenance & Updates

- **Update colors**: Edit color arrays in component files
- **Update typography**: Edit font sizes in component classNames
- **Add new components**: Follow the existing pattern (icon, gradient, hover states)
- **Test responsiveness**: Check on mobile (sm), tablet (md), and desktop (lg)

