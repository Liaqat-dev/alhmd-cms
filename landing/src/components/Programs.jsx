const PROGRAMS = [
  {
    code: 'F.Sc Pre-Medical',
    subjects: ['Biology', 'Chemistry', 'Physics', 'English'],
    leads: 'MBBS, BDS and allied health degrees',
    accent: 'text-brick',
  },
  {
    code: 'F.Sc Pre-Engineering',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
    leads: 'Engineering and architecture universities',
    accent: 'text-teal',
  },
  {
    code: 'I.C.S — Computer Science',
    subjects: ['Computer Science', 'Mathematics', 'Physics', 'English'],
    leads: 'Software and computing degrees',
    accent: 'text-amber-deep',
  },
  {
    code: 'I.T — Information Technology',
    subjects: ['Computer Science', 'Statistics', 'Economics', 'English'],
    leads: 'IT, business and data-focused degrees',
    accent: 'text-teal',
  },
  {
    code: 'F.A — Arts',
    subjects: ['Education', 'Economics', 'English Literature'],
    leads: 'Teaching, humanities and civil service study',
    accent: 'text-brick',
  },
]

export default function Programs() {
  return (
    <section id="programs" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="max-w-xl">
        <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          Five programs, one board.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink/65">
          Every program is a two-year F.Sc, I.C.S, I.T or F.A course examined
          by BISE Bahawalpur. Choose the one that matches where you want to
          go next.
        </p>
      </div>

      <div className="mt-14 divide-y divide-ink/10 border-t border-ink/10">
        {PROGRAMS.map((p) => (
          <div
            key={p.code}
            className="grid gap-4 py-8 sm:grid-cols-[1fr_1.4fr_1fr] sm:items-center sm:gap-8"
          >
            <h3 className={`font-display text-xl font-bold ${p.accent}`}>{p.code}</h3>
            <div className="flex flex-wrap gap-2">
              {p.subjects.map((s) => (
                <span
                  key={s}
                  className="rounded-sm border border-ink/15 px-2.5 py-1 text-[12px] text-ink/70"
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="text-[13px] text-ink/55 sm:text-right">Leads to {p.leads}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
