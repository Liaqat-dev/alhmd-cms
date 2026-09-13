import DashboardLayout from '@/components/layout/DashboardLayout'
import {useClasses} from '@/hooks/useClasses'
import ReportsView from '@/components/shared/ReportsView'

export default function AdminReports() {
    const {classes} = useClasses()

    return (
        <DashboardLayout title="Monthly Reports">
            <ReportsView
                availableClasses={classes}
                canGenerate
            />
        </DashboardLayout>
    )
}
