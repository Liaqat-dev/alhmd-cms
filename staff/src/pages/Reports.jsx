import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useClasses } from '@/hooks/useClasses'
import { useAuth } from '@/context/AuthContext'
import { teachersAPI } from '@/services/api'
import ReportsView from '@/components/shared/ReportsView'

// Only the class list (and, by extension, what can be generated/edited)
// differs by account — a teacher only ever sees their own classes, everyone
// else with reports.view sees all of them. ReportsView itself is identical.
export default function Reports() {
    const { isTeacher, hasPermission } = useAuth()
    const { classes: allClasses } = useClasses({ enabled: !isTeacher })
    const [myClasses, setMyClasses] = useState([])

    useEffect(() => {
        if (!isTeacher) return
        teachersAPI.getMyClasses()
            .then(res => {
                const pairs = res.data.classes || []
                setMyClasses(pairs.map(p => ({ id: p.classId, name: `${p.className} — ${p.subjectName}` })))
            })
            .catch(() => {})
    }, [isTeacher])

    return (
        <DashboardLayout title="Monthly Reports">
            <ReportsView
                availableClasses={isTeacher ? myClasses : allClasses}
                canGenerate={hasPermission('reports.create')}
                canEditRemarks={hasPermission('reports.edit')}
            />
        </DashboardLayout>
    )
}
