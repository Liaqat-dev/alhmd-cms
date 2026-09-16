import DashboardLayout from '@/components/layout/DashboardLayout'
import Salaries from './salaries/Salaries'

export default function AdminSalaries() {
  return (
    <DashboardLayout title="Teacher Salaries">
      <Salaries />
    </DashboardLayout>
  )
}
