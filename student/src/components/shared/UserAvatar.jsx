/**
 * UserAvatar — shows a profile picture if available, otherwise a coloured initial.
 *
 * Props:
 *   name        {string}  — used for the initial fallback
 *   profilePicUrl {string|null} — Cloudinary URL
 *   size        {'xs'|'sm'|'md'|'lg'} — controls dimensions
 *   shape       {'circle'|'rounded'} — border-radius style (default: circle)
 *   className   {string}  — extra classes applied to the wrapper
 */
export default function UserAvatar({
  name = '',
  profilePicUrl = null,
  size = 'sm',
  shape = 'circle',
  className = '',
}) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-16 w-16 text-2xl',
    xl: 'h-20 w-20 text-3xl',
  }

  const shapeClass = shape === 'rounded' ? 'rounded-2xl' : 'rounded-full'
  const sizeClass = sizeClasses[size] || sizeClasses.sm
  const initial = (name || 'U').charAt(0).toUpperCase()

  if (profilePicUrl) {
    return (
      <img
        src={profilePicUrl}
        alt={name || 'User'}
        className={`${sizeClass} ${shapeClass} object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} ${shapeClass} bg-primary-500/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0 font-semibold text-primary-600 dark:text-primary-400 ${className}`}
    >
      {initial}
    </div>
  )
}
