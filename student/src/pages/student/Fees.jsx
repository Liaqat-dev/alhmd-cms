import DashboardLayout from '@/components/layout/DashboardLayout'
import MorningFees from './fees/MorningFees'

export default function StudentFees() {
  return (
    <DashboardLayout title="My Fees">
      <MorningFees />
    </DashboardLayout>
  )
}
