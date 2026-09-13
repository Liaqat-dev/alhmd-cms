export default function Heritage() {
  return (
    <section id="campus" className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              One building. Everything a student needs.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/70">
              Al-Hamd isn't spread across a sprawling campus — it's a single
              college building in Bahawalpur, a city of canal-irrigated
              fields on one side and the Cholistan desert on the other.
              Lecture rooms, labs and the library sit under one roof, which
              means less walking between classes and more time in them.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-white/70">
              Chemistry, biology and physics practicals run in dedicated labs
              rather than shared classrooms, so every student completes the
              practical notebook her board exam requires.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8">
              <div>
                <dt className="text-[13px] text-white/50">Labs in the building</dt>
                <dd className="font-display mt-1 text-2xl font-bold text-amber">3</dd>
              </div>
              <div>
                <dt className="text-[13px] text-white/50">Admission requirement</dt>
                <dd className="font-display mt-1 text-2xl font-bold text-amber">None</dd>
              </div>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <img
              src="/images/wheat-field.jpg"
              alt="Canal-irrigated fields on the outskirts of Bahawalpur, Punjab"
              className="arch-sm h-56 w-full object-cover sm:h-64"
            />
            <img
              src="/images/microscope.jpg"
              alt="A student examining a slide under a microscope"
              className="arch-sm mt-8 h-56 w-full object-cover sm:h-64"
            />
            <img
              src="/images/lab-testtubes.jpg"
              alt="Glassware racked in the college chemistry lab"
              className="arch-sm h-56 w-full object-cover sm:h-64"
            />
            <img
              src="/images/study-desk.jpg"
              alt="A student's desk stacked with notebooks and revision cards"
              className="arch-sm mt-8 h-56 w-full object-cover object-bottom sm:h-64"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
