import DashboardLayout from '@/components/layout/DashboardLayout'
import MorningSalaries from './salaries/MorningSalaries'

export default function AdminSalaries() {
  return (
    <DashboardLayout title="Teacher Salaries">
      <MorningSalaries />
    </DashboardLayout>
  )
}
