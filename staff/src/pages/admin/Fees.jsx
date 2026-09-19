import DashboardLayout from '@/components/layout/DashboardLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Fees from './fees/Fees'
import PaymentHistory from './fees/PaymentHistory'
import { CreditCard, ReceiptText } from 'lucide-react'

export default function AdminFees() {
  return (
    <DashboardLayout title="Fee Management">
      <Tabs defaultValue="fees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fees" className="gap-1.5">
            <ReceiptText className="h-3.5 w-3.5" /> Fees
          </TabsTrigger>
          <TabsTrigger value="payment-history" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Payment History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fees">
          <Fees />
        </TabsContent>
        <TabsContent value="payment-history">
          <PaymentHistory />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
