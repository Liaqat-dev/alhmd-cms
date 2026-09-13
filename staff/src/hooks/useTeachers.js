import { useState, useEffect, useCallback, useRef } from 'react'
import { teachersAPI } from '@/services/api'

export function useTeachers() {
  const [teachers, setTeachers] = useState([])
  const [teachersLoading, setTeachersLoading] = useState(false)
  const fetchCount = useRef(0)

  const fetchTeachers = useCallback(async () => {
    const id = ++fetchCount.current
    setTeachersLoading(true)
    try {
      const response = await teachersAPI.getAll()
      if (id === fetchCount.current) setTeachers(response.data.teachers)
    } finally {
      if (id === fetchCount.current) setTeachersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  return {
    teachers,
    teachersLoading,
    refreshTeachers: fetchTeachers,
  }
}
