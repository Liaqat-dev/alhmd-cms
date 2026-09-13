import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import MorningFees from './fees/MorningFees'
import PaymentHistory from './fees/PaymentHistory'
import { CreditCard, ReceiptText } from 'lucide-react'

const TABS = [
  { id: 'fees', label: 'Fees', icon: ReceiptText },
  { id: 'payment-history', label: 'Payment History', icon: CreditCard },
]

export default function AdminFees() {
  const [activeTab, setActiveTab] = useState('fees')

  return (
    <DashboardLayout title="Fee Management">
      <div className="space-y-4">
        <div className="border-b border-gray-200 dark:border-dark-700">
          <nav className="flex gap-0 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:border-gray-300 dark:hover:border-dark-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div>
          {activeTab === 'fees' && <MorningFees />}
          {activeTab === 'payment-history' && <PaymentHistory />}
        </div>
      </div>
    </DashboardLayout>
  )
}
