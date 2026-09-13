import { useEffect, useState } from 'react'

const LINKS = [
  { href: '#programs', label: 'Programs' },
  { href: '#campus', label: 'Facilities' },
  { href: '#admissions', label: 'Admissions' },
  { href: '#contact', label: 'Contact' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-ink/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(255,255,255,0.06)]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/images/crest.png" alt="Al-Hamd Science College crest" className="h-9 w-9 object-contain" />
          <span className="font-display leading-tight text-white">
            <span className="block text-[13px] font-bold tracking-tight">AL-HAMD</span>
            <span className="block -mt-1 text-[9px] font-semibold tracking-[0.16em] text-white/60">
              SCIENCE COLLEGE
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="#admissions"
          className="hidden rounded-sm bg-amber px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-amber-deep hover:text-white sm:inline-block"
        >
          Apply for admission
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center text-white md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 top-0 h-[1.5px] w-full bg-current transition-transform ${open ? 'translate-y-[6.5px] rotate-45' : ''}`}
            />
            <span className={`absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-current transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span
              className={`absolute bottom-0 left-0 h-[1.5px] w-full bg-current transition-transform ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ink px-5 pb-5 pt-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-sm px-2 py-2.5 text-[15px] text-white/80 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#admissions"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-sm bg-amber px-4 py-2.5 text-center text-sm font-semibold text-ink"
            >
              Apply for admission
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
