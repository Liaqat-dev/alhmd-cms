const STEPS = [
  {
    n: '1',
    title: 'Submit the online application',
    body: 'Enter your matric result and choose Pre-Medical, Pre-Engineering, I.C.S, I.T or F.A.',
  },
  {
    n: '2',
    title: 'Get your seat confirmed',
    body: 'No entry test, no merit list — every applicant who meets the matric requirement is admitted.',
  },
  {
    n: '3',
    title: 'Pay the admission fee',
    body: 'Pay at the campus office, in person or through the bank challan sent with your confirmation.',
  },
  {
    n: '4',
    title: 'Collect your timetable',
    body: 'Classes start the following week. Books and the practical schedule are given on day one.',
  },
]

export default function Admissions() {
  return (
    <section id="admissions" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <img
            src="/images/grad-cap.jpg"
            alt="A mortarboard and academic hood, ready for convocation"
            className="arch h-[26rem] w-full max-w-sm object-cover shadow-xl"
          />
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Admission, in four steps.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink/65">
            There's no entry test and no merit list to clear. If you've
            passed your matric, there's a seat here for you.
          </p>

          <ol className="mt-10 space-y-8">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-5">
                <span className="font-display flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 border-brick text-sm font-bold text-brick">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink/60">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <a
            href="#contact"
            className="mt-10 inline-block rounded-sm bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brick"
          >
            Start your application
          </a>
        </div>
      </div>
    </section>
  )
}
