const ROWS = [
  { value: '5', label: 'programs to choose from' },
  { value: 'Girls only', label: 'admission is open to' },
  { value: 'No entry test', label: 'or merit list required' },
  { value: 'BISE', label: 'Bahawalpur affiliation' },
]

export default function Ledger() {
  return (
    <section className="border-y border-ink/10 bg-parchment-dim/40">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid divide-y divide-ink/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {ROWS.map((r) => (
            <div key={r.label} className="py-6 sm:px-6 sm:py-8">
              <p className="font-display text-3xl font-bold text-ink sm:text-4xl">{r.value}</p>
              <p className="mt-1 text-[13px] leading-snug text-ink/60">{r.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
