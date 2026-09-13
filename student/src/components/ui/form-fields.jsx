/**
 * form-fields.jsx — Reusable form field components
 *
 * All components follow the same visual language:
 *   - Label   : uppercase, tight tracking, muted gray
 *   - Input   : left icon, clean border, smooth focus ring
 *   - Error   : red border + ring, message below the field
 *
 * Every component accepts `error` (string) which can come from either
 * Formik client-side validation or backend field errors mapped by useAppForm.
 *
 * Integrate with Formik:
 *   <FormField
 *     label="Email"
 *     name="email"
 *     icon={<Mail className="h-4 w-4" />}
 *     value={formik.values.email}
 *     error={formik.touched.email && formik.errors.email}
 *     onChange={formik.handleChange}
 *     onBlur={formik.handleBlur}
 *   />
 */

import { useState } from 'react'
import { Eye, EyeOff, ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Shared primitives ─────────────────────────────────────────────────────────

const FieldLabel = ({ htmlFor, children, required }) => (
  <label
    htmlFor={htmlFor}
    className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-400"
  >
    {children}
    {required && <span className="ml-0.5 text-red-400">*</span>}
  </label>
)

const FieldError = ({ message }) =>
  message ? (
    <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  ) : null

// Base classes shared by all field variants
const baseInput = [
  'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border',
  'bg-white dark:bg-dark-900',
  'text-gray-900 dark:text-dark-100',
  '[color-scheme:light] dark:[color-scheme:dark]',
  'placeholder:text-gray-400 dark:placeholder:text-dark-500',
  'transition-colors duration-150',
  'focus:outline-none focus:ring-2',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-dark-850',
].join(' ')

const normalBorder =
  'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600 focus:ring-primary-500/15 focus:border-primary-500 dark:focus:border-primary-400'
const errorBorder =
  'border-red-400 dark:border-red-500 hover:border-red-400 focus:ring-red-400/20 focus:border-red-400'

const resolveVariant = (hasError) => (hasError ? errorBorder : normalBorder)

// ── FormField — text / email / number / date / password / textarea ─────────────

export const FormField = ({
  label,
  name,
  type = 'text',
  icon,
  placeholder,
  value,
  error,
  disabled,
  required,
  textarea = false,
  rows = 3,
  onChange,
  onBlur,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type

  const inputClass = cn(
    baseInput,
    resolveVariant(!!error),
    isPassword && 'pr-10',
    className
  )

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        {/* Left icon */}
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-dark-500">
          {icon}
        </span>

        {textarea ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
            className={cn(inputClass, 'resize-none pt-2.5')}
          />
        ) : (
          <input
            id={name}
            type={resolvedType}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={inputClass}
          />
        )}

        {/* Password show/hide toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-dark-500 hover:text-gray-600 dark:hover:text-dark-300 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      <FieldError message={error} />
    </div>
  )
}

// ── FormSelect — native <select> styled to match FormField ───────────────────

export const FormSelect = ({
  label,
  name,
  icon,
  placeholder = 'Select an option',
  value,
  error,
  disabled,
  required,
  options = [],
  onChange,
  onBlur,
  className,
}) => {
  const selectClass = cn(
    baseInput,
    'pr-9 appearance-none cursor-pointer',
    resolveVariant(!!error),
    className
  )

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={name} required={required}>
        {label}
      </FieldLabel>
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-dark-500">
          {icon}
        </span>

        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={selectClass}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400 dark:text-dark-500">
          <ChevronDown className="h-4 w-4" />
        </span>
      </div>
      <FieldError message={error} />
    </div>
  )
}

// ── FormDate — date input with calendar icon slot ────────────────────────────

export const FormDate = ({ icon, className, ...props }) => (
  <FormField
    type="date"
    icon={icon}
    className={cn('[&::-webkit-calendar-picker-indicator]:cursor-pointer', className)}
    {...props}
  />
)

// ── ServerError — general (non-field) error banner ───────────────────────────

export const ServerError = ({ message, onDismiss }) => {
  if (!message) return null
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3.5 py-3 text-sm text-red-700 dark:text-red-400">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span className="flex-1 leading-snug">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  )
}
