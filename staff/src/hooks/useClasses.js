import { useState, useEffect, useCallback, useRef } from 'react'
import { classesAPI } from '@/services/api'

export function useClasses() {
  const [classes, setClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(false)
  const fetchCount = useRef(0)

  const fetchClasses = useCallback(async () => {
    const id = ++fetchCount.current
    setClassesLoading(true)
    try {
      const response = await classesAPI.getAll()
      if (id === fetchCount.current) setClasses(response.data.classes)
    } finally {
      if (id === fetchCount.current) setClassesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  return {
    classes,
    classesLoading,
    refreshClasses: fetchClasses,
  }
}
