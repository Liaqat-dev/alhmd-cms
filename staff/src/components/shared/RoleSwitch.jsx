import { useAuth } from '@/context/AuthContext'

// Some pages are genuinely different for an admin vs. a teacher (different
// API calls, different layout entirely — not just "all data" vs. "my data")
// but still belong at one shared URL now that /admin and /teacher prefixes
// are gone. This picks which component to render for the current account,
// without merging code that doesn't actually overlap.
export default function RoleSwitch({ admin: Admin, teacher: Teacher }) {
  const { isTeacher } = useAuth()
  return isTeacher ? <Teacher /> : <Admin />
}
