# Implementation Guide - Student Dashboard Design System

## Quick Start

### 1. Import Components into Any Page

```jsx
import ProfileHeader from '@/components/dashboard/student/ProfileHeader'
import TodaysLectures from '@/components/dashboard/student/TodaysLectures'
import AttendanceStats from '@/components/dashboard/student/AttendanceStats'
import ClassStats from '@/components/dashboard/student/ClassStats'
import AnnouncementsSection from '@/components/dashboard/student/AnnouncementsSection'
```

### 2. Import Style Utilities

```jsx
import {
  getSubjectColor,
  getAttendanceStatus,
  formatTimeAgo,
  TYPOGRAPHY,
  SPACING,
  RESPONSIVE_GRID,
} from '@/utils/dashboardStyles'
```

---

## Component Usage Examples

### ProfileHeader
Shows student info, name, and key stats at the top of pages.

```jsx
<ProfileHeader 
  student={{
    name: 'John Doe',
    rollNumber: '12345',
    className: '10-A',
    section: 'Morning',
    dateOfBirth: '2008-01-15',
    enrolledClasses: [{}, {}],
  }}
  stats={{
    percentage: 85,
    present: 42,
    absent: 3,
    total: 45,
  }}
/>
```

**Use in:**
- Dashboard
- Profile page
- Report card page
- Any page needing student identity confirmation

---

### TodaysLectures
Timeline view of current day's scheduled classes.

```jsx
<TodaysLectures 
  lectures={[
    {
      id: 1,
      startTime: '2024-04-25T09:00:00',
      endTime: '2024-04-25T10:00:00',
      subject: { name: 'Mathematics' },
      class: { name: 'Class 10-A' },
      teacher: { name: 'Mr. Ahmed' },
      room: '201',
      duration: 60,
    },
    // ... more lectures
  ]}
/>
```

**Use in:**
- Dashboard
- Timetable page (filtered to today)
- Class attendance pages

---

### AttendanceStats
Subject-wise attendance cards showing percentages and status.

```jsx
<AttendanceStats 
  attendanceStats={[
    {
      subjectId: 1,
      name: 'English',
      total: 20,
      present: 18,
      absent: 2,
      late: 0,
      percentage: 90,
    },
    // ... more subjects
  ]}
  month="April"
  year={2024}
/>
```

**Use in:**
- Dashboard
- Attendance report page
- Subject-wise performance page

**Customization:**
```jsx
// Show different number of columns
const attendanceStats = [...]
const limit = 6
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {attendanceStats.slice(0, limit).map((stat, idx) => (
    <AttendanceCard key={idx} subject={stat} colorIndex={idx} />
  ))}
</div>
```

---

### ClassStats
Card grid showing enrolled classes with stats.

```jsx
<ClassStats 
  classes={[
    {
      id: 1,
      name: 'Class 10-A',
      section: 'Morning',
      teacherCount: 5,
      subjects: [{ id: 1 }, { id: 2 }],
      createdAt: '2024-01-01',
    },
    // ... more classes
  ]}
/>
```

**Use in:**
- Dashboard
- Classes page
- Enrollment status page

---

### AnnouncementsSection
List of announcements with priority indicators.

```jsx
<AnnouncementsSection 
  announcements={[
    {
      id: 1,
      title: 'Exam Schedule Released',
      content: 'Mid-term exams will be held from May 1-10...',
      priority: 'HIGH',
      publishedAt: '2024-04-25T10:00:00',
    },
    // ... more announcements
  ]}
  limit={5}  // Show only 5, rest in "View all"
/>
```

**Use in:**
- Dashboard
- Announcements page
- Home page

---

## Building Custom Components with Design System

### Example: Create a Custom "Pending Assignments" Card

```jsx
import { getSubjectColor, TYPOGRAPHY, SPACING } from '@/utils/dashboardStyles'
import { AlertCircle, CheckCircle } from 'lucide-react'

export function PendingAssignments({ assignments = [] }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-sm">
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <AlertCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className={TYPOGRAPHY.h2}>Pending Assignments</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tasks due this week
          </p>
        </div>
      </div>

      {/* Assignment list */}
      <div className="space-y-3">
        {assignments.map((assignment, idx) => {
          const color = getSubjectColor(idx)
          return (
            <div key={assignment.id} className={`rounded-lg border-2 p-4 bg-gradient-to-br ${color.light} ${color.border}`}>
              <div className="flex items-start gap-3">
                <div className={`h-4 w-4 rounded-full mt-1 ${color.dot}`} />
                <div className="flex-1">
                  <h4 className={`font-bold ${color.text}`}>
                    {assignment.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {assignment.subject}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground mt-2">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-shrink-0 px-2 py-1 bg-primary/10 rounded text-xs font-bold text-primary">
                  {Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Usage
<PendingAssignments assignments={assignmentData} />
```

---

### Example: Create a Custom "Performance Chart"

```jsx
import { getSubjectColor, RESPONSIVE_GRID } from '@/utils/dashboardStyles'
import { TrendingUp } from 'lucide-react'

export function PerformanceOverview({ subjects = [] }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold font-display tracking-tight">
          Performance by Subject
        </h2>
      </div>

      <div className={`grid ${RESPONSIVE_GRID.auto} gap-4`}>
        {subjects.map((subject, idx) => {
          const color = getSubjectColor(idx)
          const score = subject.marks / subject.totalMarks * 100

          return (
            <div key={subject.id} className="rounded-lg p-4 bg-gradient-to-br from-muted/50">
              {/* Subject name */}
              <h3 className={`font-bold ${color.text} mb-3`}>
                {subject.name}
              </h3>

              {/* Score bar */}
              <div className="h-2 rounded-full bg-foreground/10 overflow-hidden mb-2">
                <div
                  className={`h-full bg-gradient-to-r ${color.gradient}`}
                  style={{ width: `${score}%` }}
                />
              </div>

              {/* Score display */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  {subject.marks}/{subject.totalMarks}
                </span>
                <span className="text-sm font-bold text-muted-foreground">
                  {Math.round(score)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Usage
<PerformanceOverview subjects={performanceData} />
```

---

## Styling Patterns You Can Reuse

### Pattern 1: Card with Gradient Top

```jsx
<div className="rounded-xl border-2 border-blue-200/30 bg-gradient-to-br from-blue-500/10 to-blue-400/5 p-4">
  {/* Content */}
</div>
```

### Pattern 2: Icon Badge

```jsx
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
  <Icon className="h-5 w-5 text-primary" />
</div>
```

### Pattern 3: Progress Bar with Status

```jsx
<div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
    style={{ width: `${percentage}%` }}
  />
</div>
```

### Pattern 4: Timeline

```jsx
<div className="relative">
  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 to-transparent" />
  <div className="absolute left-3 top-2 h-6 w-6 rounded-full border-2 border-background bg-primary" />
  <div className="ml-20 rounded-lg border-2 p-4">
    {/* Content */}
  </div>
</div>
```

### Pattern 5: Empty State

```jsx
<div className="flex flex-col items-center justify-center py-12 gap-3">
  <div className="rounded-full bg-muted p-4">
    <Icon className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="text-sm font-medium text-muted-foreground">No data</p>
  <p className="text-xs text-muted-foreground">Description</p>
</div>
```

---

## Best Practices

### ✅ DO

1. **Use the color system consistently**
   ```jsx
   const color = getSubjectColor(index)
   <div className={`bg-gradient-to-br ${color.light}`} />
   ```

2. **Maintain responsive spacing**
   ```jsx
   <div className="p-4 md:p-6 lg:p-8">Content</div>
   ```

3. **Apply animations to enhance UX**
   ```jsx
   <div className="transition-all duration-300 hover:shadow-md">
   ```

4. **Use semantic icons**
   ```jsx
   import { Clock, BookOpen, Users, TrendingUp } from 'lucide-react'
   ```

5. **Group related sections with whitespace**
   ```jsx
   <div className="space-y-6 lg:space-y-8">
     <Section1 />
     <Section2 />
   </div>
   ```

### ❌ DON'T

1. **Don't hardcode colors**
   ```jsx
   // ❌ Bad
   <div className="bg-blue-500">
   // ✅ Good
   <div className={`bg-gradient-to-r ${getSubjectColor(0).gradient}`}>
   ```

2. **Don't mix spacing scales**
   ```jsx
   // ❌ Bad - inconsistent padding
   <div className="p-3 md:p-4 lg:p-5">
   // ✅ Good - consistent scale
   <div className="p-4 md:p-6 lg:p-8">
   ```

3. **Don't skip responsive design**
   ```jsx
   // ❌ Bad - only desktop sizes
   <div className="text-lg p-6">
   // ✅ Good - responsive at all breakpoints
   <div className="text-sm md:text-base lg:text-lg p-4 md:p-6 lg:p-8">
   ```

4. **Don't create duplicate components**
   - Use existing components and customize via props
   - Create new components only if 3+ places need similar UI

5. **Don't ignore accessibility**
   ```jsx
   // ✅ Good - proper contrast and semantic HTML
   <h1 className="text-2xl font-bold">Title</h1>
   <p className="text-muted-foreground">Description</p>
   ```

---

## Theme Support

### Switching Colors Dynamically

```jsx
// In your layout or App.tsx
const [theme, setTheme] = useState('green') // or 'orange', 'teal', etc.

// Apply to html element
useEffect(() => {
  document.documentElement.setAttribute('data-colors', theme)
}, [theme])

// In component
<select value={theme} onChange={(e) => setTheme(e.target.value)}>
  <option value="green">Green</option>
  <option value="orange">Orange</option>
  <option value="teal">Teal</option>
  <option value="violet">Violet</option>
</select>
```

---

## Performance Tips

1. **Use CSS Grid for layout** - More efficient than flexbox for structured layouts
2. **Lazy load components** - Especially announcements and lecture lists
3. **Memoize heavy components** - Use `React.memo()` for card components
4. **Use `list` instead of `map` keys** - Improves React reconciliation
5. **Avoid inline styles** - Use Tailwind classes for better caching

---

## Troubleshooting

### Colors not applying?
- Check `data-colors` attribute on `<html>`
- Verify Tailwind CSS is properly configured
- Clear cache and rebuild

### Responsive layout breaking?
- Check breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`
- Test on actual devices, not just browser resize
- Use Chrome DevTools device mode

### Performance issues?
- Profile with React DevTools
- Check for unnecessary re-renders
- Optimize images and assets
- Use lazy loading for below-the-fold content

---

## File Structure Reference

```
frontend/src/
├── components/
│   └── dashboard/
│       ├── student/
│       │   ├── ProfileHeader.jsx
│       │   ├── TodaysLectures.jsx
│       │   ├── AttendanceStats.jsx
│       │   ├── ClassStats.jsx
│       │   └── AnnouncementsSection.jsx
│       ├── DesignSystem.md (this file)
│       └── IMPLEMENTATION_GUIDE.md
│
├── utils/
│   └── dashboardStyles.js
│
└── pages/
    └── student/
        └── Dashboard.jsx (example of all components used)
```

---

## Need Help?

1. **Refer to DesignSystem.md** for color and spacing details
2. **Check dashboardStyles.js** for available utilities
3. **Look at Dashboard.jsx** for component usage examples
4. **Review component source files** for customization options

---

## Version

- **Version**: 1.0
- **Last Updated**: 2024
- **Tailwind**: 3.x
- **React**: 18.x

