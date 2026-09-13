import { useState, useEffect, useCallback, useRef } from 'react'
import { subjectsAPI } from '@/services/api'

export function useSubjects(classId) {
  const [subjects, setSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const fetchCount = useRef(0)

  const fetchSubjects = useCallback(async (params) => {
    const id = ++fetchCount.current
    setSubjectsLoading(true)
    try {
      const response = await subjectsAPI.getAll(params)
      if (id === fetchCount.current) setSubjects(response.data.subjects)
    } finally {
      if (id === fetchCount.current) setSubjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    const params = classId ? { classId } : {}
    fetchSubjects(params)
  }, [classId, fetchSubjects])

  return {
    subjects,
    subjectsLoading,
    refreshSubjects: fetchSubjects,
  }
}