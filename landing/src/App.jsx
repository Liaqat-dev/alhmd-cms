import Nav from './components/Nav'
import Hero from './components/Hero'
import Ledger from './components/Ledger'
import Programs from './components/Programs'
import Heritage from './components/Heritage'
import Admissions from './components/Admissions'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-parchment text-ink">
      <Nav />
      <Hero />
      <Ledger />
      <Programs />
      <Heritage />
      <Admissions />
      <Footer />
    </div>
  )
}
