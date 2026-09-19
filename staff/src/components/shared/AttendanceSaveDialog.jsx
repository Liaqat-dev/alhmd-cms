import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

/**
 * AttendanceSaveDialog — confirms the totals before attendance is written.
 *
 * The roster defaults everyone to present, so saving is a single click that
 * records the whole list. This is the step that makes the admin look at what
 * they are about to commit.
 *
 * Props:
 *   open        {boolean}
 *   onOpenChange{(open) => void}
 *   subtitle    {string|null}  — class and/or date being marked
 *   present     {number}
 *   absent      {number}
 *   leave       {number}
 *   total       {number}
 *   noun        {string}       — 'student' | 'teacher', for the total line
 *   saving      {boolean}
 *   onConfirm   {() => void}
 */

const TILES = [
  { key: 'present', label: 'Present', box: 'border-emerald-200 bg-emerald-50/60', count: 'text-emerald-700', text: 'text-emerald-600' },
  { key: 'leave',   label: 'Leave',   box: 'border-amber-200 bg-amber-50/60',     count: 'text-amber-700',   text: 'text-amber-600' },
  { key: 'absent',  label: 'Absent',  box: 'border-rose-200 bg-rose-50/60',       count: 'text-rose-700',    text: 'text-rose-600' },
]

export default function AttendanceSaveDialog({
  open,
  onOpenChange,
  subtitle = null,
  present = 0,
  absent = 0,
  leave = 0,
  total = 0,
  noun = 'student',
  saving = false,
  onConfirm,
}) {
  const counts = { present, absent, leave }

  return (
    <Dialog open={open} onOpenChange={next => { if (!saving) onOpenChange(next) }}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save attendance?</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {TILES.map(({ key, label, box, count, text }) => (
            <div key={key} className={`rounded-lg border p-3 text-center ${box}`}>
              <p className={`text-2xl font-bold ${count}`}>{counts[key]}</p>
              <p className={`text-xs font-medium ${text}`}>{label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {total} {noun}{total === 1 ? '' : 's'} in total.
        </p>

        <DialogFooter className="flex-row justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
