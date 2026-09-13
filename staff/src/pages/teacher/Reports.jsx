import {useEffect, useState} from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {teachersAPI} from '@/services/api'
import ReportsView from '@/components/shared/ReportsView'

export default function TeacherReports() {
    const [myClasses, setMyClasses] = useState([])

    useEffect(() => {
        teachersAPI.getMyClasses()
            .then(res => {
                const pairs = res.data.classes || []
                setMyClasses(pairs.map(p => ({id: p.classId, name: `${p.className} — ${p.subjectName}`})))
            })
            .catch(() => {})
    }, [])

    return (
        <DashboardLayout title="Student Reports">
            <ReportsView
                availableClasses={myClasses}
                canGenerate
                canEditRemarks
            />
        </DashboardLayout>
    )
}
