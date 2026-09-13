/**
 * Dashboard Design System Utilities
 * Reusable color palettes, style constants, and helper functions
 * for building consistent UIs across student dashboard pages
 */

// ─── Color Palettes ───────────────────────────────────────────

/**
 * Subject/Class Color Palette
 * Neutral professional styling - color reserved for semantic meaning only
 */
export const SUBJECT_COLORS = [
  {
    name: 'neutral',
    gradient: 'from-foreground/8 to-foreground/4',
    light: 'from-foreground/5 to-foreground/2',
    bg: 'bg-muted/40',
    text: 'text-foreground',
    border: 'border-border',
    label: 'bg-muted',
    dot: 'bg-foreground/40',
  },
]

/**
 * Semantic Status Colors - use color to communicate meaning
 */
export const STATUS_COLORS = {
  good: {
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200/40 dark:border-emerald-800/40',
    dot: 'bg-emerald-600',
  },
  warning: {
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200/40 dark:border-amber-800/40',
    dot: 'bg-amber-600',
  },
  critical: {
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200/40 dark:border-red-800/40',
    dot: 'bg-red-600',
  },
  active: {
    text: 'text-foreground/70',
    bg: 'bg-muted/50',
    border: 'border-border',
    dot: 'bg-foreground/40',
  },
}

/**
 * Get a color from the palette by index
 * Returns neutral color - all subjects use same styling for professional appearance
 */
export const getSubjectColor = (index = 0) => {
  return SUBJECT_COLORS[0]
}

/**
 * Get status color by status type
 */
export const getStatusColor = (status = 'active') => {
  return STATUS_COLORS[status] || STATUS_COLORS.active
}

// ─── Attendance Status Utilities ───────────────────────────────

/**
 * Attendance percentage to status mapping
 */
export const getAttendanceStatus = (percentage) => {
  if (percentage >= 85) return { status: 'good', label: 'Good', color: 'text-emerald-600' }
  if (percentage >= 75) return { status: 'warning', label: 'At Risk', color: 'text-amber-600' }
  return { status: 'critical', label: 'Critical', color: 'text-rose-600' }
}

/**
 * Get background color for attendance status
 */
export const getAttendanceStatusBg = (percentage) => {
  if (percentage >= 85) return 'bg-emerald-50 dark:bg-emerald-950/30'
  if (percentage >= 75) return 'bg-amber-50 dark:bg-amber-950/30'
  return 'bg-rose-50 dark:bg-rose-950/30'
}

// ─── Announcement Priority Styles ─────────────────────────────

export const ANNOUNCEMENT_PRIORITY_CONFIG = {
  URGENT: {
    gradient: 'from-destructive/10 to-destructive/5',
    border: 'border-destructive/30',
    text: 'text-destructive',
    label: 'Urgent',
    dotBg: 'bg-destructive',
    icon: 'AlertCircle',
  },
  HIGH: {
    gradient: 'from-destructive/10 to-destructive/5',
    border: 'border-destructive/20',
    text: 'text-destructive',
    label: 'High',
    dotBg: 'bg-destructive',
    icon: 'AlertCircle',
  },
  NORMAL: {
    gradient: 'from-primary/10 to-primary/5',
    border: 'border-primary/20',
    text: 'text-primary',
    label: 'Info',
    dotBg: 'bg-primary',
    icon: 'Info',
  },
  INFORMATIONAL: {
    gradient: 'from-blue-500/10 to-blue-500/5',
    border: 'border-blue-200/30',
    text: 'text-blue-600',
    label: 'Info',
    dotBg: 'bg-blue-500',
    icon: 'Info',
  },
  LOW: {
    gradient: 'from-muted to-muted/50',
    border: 'border-border/30',
    text: 'text-muted-foreground',
    label: 'Low',
    dotBg: 'bg-muted-foreground',
    icon: 'Info',
  },
}

/**
 * Get announcement priority config by priority level
 */
export const getAnnouncementConfig = (priority) => {
  return ANNOUNCEMENT_PRIORITY_CONFIG[priority] || ANNOUNCEMENT_PRIORITY_CONFIG.NORMAL
}

// ─── Typography Utilities ─────────────────────────────────────

/**
 * Reusable typography classes for consistency
 */
export const TYPOGRAPHY = {
  // Headings
  h1: 'text-2xl md:text-3xl lg:text-4xl font-bold font-display tracking-tight',
  h2: 'text-xl md:text-2xl font-bold font-display tracking-tight',
  h3: 'text-lg md:text-xl font-bold tracking-tight',
  h4: 'font-bold text-base md:text-lg',
  h5: 'font-semibold text-base',

  // Body text
  body: 'text-sm md:text-base',
  bodySmall: 'text-xs md:text-sm',
  bodyTiny: 'text-[11px] md:text-xs',

  // Labels
  label: 'text-xs font-medium text-muted-foreground uppercase tracking-wider',
  labelSmall: 'text-[11px] font-medium text-muted-foreground uppercase',

  // Special
  caption: 'text-xs text-muted-foreground',
  captionSmall: 'text-[10px] text-muted-foreground/70',
}

// ─── Spacing & Layout Utilities ────────────────────────────────

export const SPACING = {
  // Padding
  cardPadding: 'p-4 md:p-5 lg:p-6',
  sectionPadding: 'p-6 md:p-8',

  // Gap/Margin
  sectionGap: 'gap-6 lg:gap-8',
  cardGap: 'gap-4 md:gap-5',
  itemGap: 'gap-3 md:gap-4',
}

// ─── Border & Shadow Utilities ────────────────────────────────

export const SHADOWS = {
  card: 'shadow-sm',
  cardHover: 'hover:shadow-md',
  cardInteractive: 'hover:shadow-md transition-all duration-300',
  heading: 'drop-shadow-sm',
}

export const BORDERS = {
  card: 'rounded-2xl border border-border/50',
  cardWithGradient: 'rounded-xl border-2',
  element: 'rounded-lg border border-border',
  tight: 'rounded-md border border-border/40',
}

// ─── Time & Date Formatting ────────────────────────────────────

/**
 * Format time difference for display (e.g., "2h ago", "Just now")
 */
export const formatTimeAgo = (date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format time for timetable display
 */
export const formatTimeRange = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
  const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`

  return `${startTime} - ${endTime}`
}

/**
 * Format date for display
 */
export const formatDate = (date, format = 'short') => {
  const options = {
    short: { month: 'short', day: 'numeric', year: '2-digit' },
    long: { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  }

  return new Date(date).toLocaleDateString('en-US', options[format] || options.short)
}

// ─── Helper Functions ──────────────────────────────────────────

/**
 * Determine if a lecture is happening now
 */
export const isLectureNow = (startTime, endTime) => {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  return now >= start && now < end
}

/**
 * Determine if a lecture has passed
 */
export const isLecturePast = (endTime) => {
  return new Date() >= new Date(endTime)
}

/**
 * Determine if a lecture is upcoming
 */
export const isLectureUpcoming = (startTime) => {
  return new Date() < new Date(startTime)
}

/**
 * Get lecture status
 */
export const getLectureStatus = (startTime, endTime) => {
  if (isLectureNow(startTime, endTime)) return 'now'
  if (isLecturePast(endTime)) return 'past'
  if (isLectureUpcoming(startTime)) return 'upcoming'
  return 'unknown'
}

// ─── Component Style Generators ────────────────────────────────

/**
 * Generate inline styles for gradient text
 */
export const gradientTextStyle = (fromColor, toColor) => ({
  background: `linear-gradient(to right, ${fromColor}, ${toColor})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
})

/**
 * Generate card styles with color
 */
export const getCardStyles = (colorIndex) => {
  const color = getSubjectColor(colorIndex)
  return {
    border: `border-2 ${color.border} rounded-xl`,
    background: `bg-gradient-to-br ${color.light}`,
    title: color.text,
    dot: color.dot,
    label: color.label,
  }
}

// ─── Responsive Utilities ──────────────────────────────────────

export const RESPONSIVE_GRID = {
  // 1 column on mobile, 2 on tablet, 3 on desktop
  auto: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  // 1 column on mobile, 2 on tablet and up
  twoCol: 'grid-cols-1 md:grid-cols-2',
  // 1 column on mobile, 3 on desktop
  threeCol: 'grid-cols-1 lg:grid-cols-3',
  // 1 column on mobile, 4 on desktop
  fourCol: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

// ─── Animation Utilities ──────────────────────────────────────

export const ANIMATIONS = {
  // Smooth transitions
  smooth: 'transition-all duration-300',
  smoothFast: 'transition-all duration-200',
  smoothSlow: 'transition-all duration-500',

  // Scale & transform
  scaleHover: 'group-hover:scale-105 transition-transform',
  slideIn: 'animate-in',
  fadeIn: 'animate-in fade-in',

  // Pulse effect
  pulse: 'animate-pulse',
  pulseSlow: 'animate-pulse [animation-duration:3s]',

  // Spin (loading)
  spin: 'animate-spin',
}

// ─── Export All as Single Object (optional) ────────────────────

export default {
  SUBJECT_COLORS,
  ANNOUNCEMENT_PRIORITY_CONFIG,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
  BORDERS,
  RESPONSIVE_GRID,
  ANIMATIONS,
  getSubjectColor,
  getRandomSubjectColor,
  getAttendanceStatus,
  getAttendanceStatusBg,
  getAnnouncementConfig,
  formatTimeAgo,
  formatTimeRange,
  formatDate,
  isLectureNow,
  isLecturePast,
  isLectureUpcoming,
  getLectureStatus,
  gradientTextStyle,
  getCardStyles,
}
