export default function Footer() {
  return (
    <footer id="contact" className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/images/crest.png" alt="Al-Hamd Science College crest" className="h-10 w-10 object-contain" />
              <span className="font-display text-sm font-bold leading-tight">
                AL-HAMD
                <br />
                <span className="text-[10px] font-semibold tracking-[0.16em] text-white/60">SCIENCE COLLEGE</span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-white/60">
              A girls' college offering Pre-Medical, Pre-Engineering, I.C.S,
              I.T and F.A, affiliated with BISE Bahawalpur. No entry test,
              no merit list.
            </p>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-wide text-white/50">Visit</h4>
            <address className="mt-4 space-y-1 text-[14px] not-italic leading-relaxed text-white/75">
              <p>Model Town Road</p>
              <p>Bahawalpur, Punjab, Pakistan</p>
            </address>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-wide text-white/50">Contact</h4>
            <ul className="mt-4 space-y-2 text-[14px] text-white/75">
              <li>
                <a href="tel:+92621110002220" className="hover:text-white">+92 62 111 000 222</a>
              </li>
              <li>
                <a href="mailto:admissions@alhamdscience.edu.pk" className="hover:text-white">
                  admissions@alhamdscience.edu.pk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Al-Hamd Science College, Bahawalpur.</p>
          <p>Affiliated with the Board of Intermediate &amp; Secondary Education, Bahawalpur.</p>
        </div>
      </div>
    </footer>
  )
}
