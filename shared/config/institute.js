// Single source of truth for the institute's display identity in both the
// staff and student portals. This codebase is reused across institutes, so
// nothing here should be a literal school name — override via VITE_INSTITUTE_*
// in each app's .env.
export const INSTITUTE_NAME = import.meta.env.VITE_INSTITUTE_NAME || 'Al-Hamd Science College'
export const INSTITUTE_TAG = import.meta.env.VITE_INSTITUTE_TAG || 'Excellence in Education'
export const INSTITUTE_SHORT_NAME = import.meta.env.VITE_INSTITUTE_SHORT_NAME || INSTITUTE_NAME
