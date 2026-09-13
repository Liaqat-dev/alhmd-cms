const FACTS = [
  { label: 'Established', value: '2011' },
  { label: 'Affiliation', value: 'BISE Bahawalpur' },
  { label: 'Programs', value: '5' },
]

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink">
      <img
        src="/images/noor-mahal.jpg"
        alt="Noor Mahal, the landmark palace of Bahawalpur, Punjab"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-transparent" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-32 sm:px-8 sm:pb-20 lg:grid-cols-[1fr_auto] lg:items-end lg:pb-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-white/70">A college for girls in Bahawalpur, Punjab</p>
          <h1 className="font-display mt-3 text-4xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Intermediate
            <br />
            education,
            <br />
            <span className="text-amber">for girls, in Bahawalpur.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/75">
            Al-Hamd Science College is a girls' college offering Pre-Medical,
            Pre-Engineering, I.C.S, I.T and F.A — with a seat open to every
            girl who applies. No entry test. No merit list.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#admissions"
              className="rounded-sm bg-amber px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-amber-deep hover:text-white"
            >
              Apply for admission
            </a>
            <a
              href="#programs"
              className="text-sm font-semibold text-white/85 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
            >
              See our programs
            </a>
          </div>
        </div>

        <dl className="arch w-full max-w-[15rem] bg-parchment px-6 pb-6 pt-14 shadow-xl lg:w-56">
          {FACTS.map((f, i) => (
            <div key={f.label} className={i > 0 ? 'mt-4 border-t border-ink/10 pt-4' : ''}>
              <dt className="text-[11px] font-medium text-ink/50">{f.label}</dt>
              <dd className="font-display text-2xl font-bold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
