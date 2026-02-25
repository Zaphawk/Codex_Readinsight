import { useEffect, useMemo, useRef, useState } from 'react'

const INR_PER_USD = 83.2
const MIN_INR = 100_000
const MAX_INR = 4_000_000_000_000

const fmtMoney = (inr, currency = 'INR') => {
  const val = currency === 'USD' ? inr / INR_PER_USD : inr
  const symbol = currency === 'USD' ? '$' : '₹'
  return symbol + Math.round(val).toLocaleString()
}

function impactFromBudget(inr, region, costs) {
  if (!region || !costs) return null
  const need = (region.healthIndex + region.educationIndex + region.povertyIndex) / 3
  const boost = 0.7 + need * 0.35
  return {
    livesSaved: Math.floor((inr * 0.35 * boost) / costs.lifeSaved.inr),
    ashaYears: Math.floor((inr * 0.22 * boost) / costs.ashaWorkerYear.inr),
    mealYears: Math.floor((inr * 0.2 * boost) / costs.middayMeals.inr),
    clinics: Math.floor((inr * 0.13 * boost) / costs.clinicSetup.inr),
    waterHomes: Math.floor((inr * 0.08 * boost) / costs.safeWater.inr),
    deworming: Math.floor((inr * 0.02 * boost) / costs.deworming.inr)
  }
}

function project(impact) {
  if (!impact) return null
  const sustained = Array.from({ length: 10 }, (_, i) => Math.floor(impact.livesSaved * Math.pow(1.09, i + 1)))
  const plateau = Array.from({ length: 10 }, (_, i) => Math.floor(impact.livesSaved * Math.pow(0.97, i + 1)))
  const collapsed = Array.from({ length: 10 }, (_, i) => (i < 2 ? Math.floor(impact.livesSaved * (i === 0 ? 1 : 0.2)) : -Math.floor(impact.livesSaved * 0.11 * (i - 1))))
  return { sustained, plateau, collapsed }
}

function Spark({ data, color = '#ff2a2a' }) {
  const max = Math.max(...data.map((d) => Math.abs(d))) || 1
  const points = data.map((d, i) => `${(i / 9) * 100},${50 - (d / max) * 44}`).join(' ')
  return <svg viewBox="0 0 100 100"><polyline fill="none" stroke={color} strokeWidth="2" points={points} /><line x1="0" y1="50" x2="100" y2="50" stroke="#333" strokeDasharray="2,2" /></svg>
}

function Heartbeat({ flatline }) {
  return <div className="heartbeat">{flatline ? '▁▁▁▁▁▁▁' : '▁▃▁▇▁▅▁▃▁▇▁'}</div>
}

function ParticleField({ intensity = 800 }) {
  const dots = Array.from({ length: intensity }, (_, i) => i)
  return <div className="particles">{dots.map((d) => <span key={d} style={{ left: `${(d * 37) % 100}%`, animationDelay: `${(d * 13) % 3000}ms` }} />)}</div>
}

export default function App() {
  const [regions, setRegions] = useState([])
  const [costs, setCosts] = useState(null)
  const [mortalityRate, setMortalityRate] = useState(12)
  const [currency, setCurrency] = useState('INR')
  const [selected, setSelected] = useState(null)
  const [budget, setBudget] = useState(MIN_INR)
  const [scenario, setScenario] = useState('sustained')
  const [ticker, setTicker] = useState(0)
  const container = useRef(null)

  useEffect(() => {
    Promise.all([fetch('/api/regions').then((r) => r.json()), fetch('/api/unit-costs').then((r) => r.json()), fetch('/api/mortality').then((r) => r.json())]).then(([r, c, m]) => {
      setRegions(r)
      setSelected(r[0])
      setCosts(c)
      setMortalityRate(m.preventableDeathsPerMinute)
    })
  }, [])

  useEffect(() => {
    const run = setInterval(() => {
      const scrollFactor = Math.min((window.scrollY || 0) / 1200, 1)
      setTicker((v) => v + mortalityRate / 60 + scrollFactor * 0.6)
    }, 1000)
    return () => clearInterval(run)
  }, [mortalityRate])

  const impact = useMemo(() => impactFromBudget(budget, selected, costs), [budget, selected, costs])
  const trends = useMemo(() => project(impact), [impact])
  const percentOfTop10 = ((budget / (1.5e12 * INR_PER_USD)) * 100).toFixed(4)

  const logMin = Math.log10(MIN_INR)
  const logMax = Math.log10(MAX_INR)
  const slider = ((Math.log10(budget) - logMin) / (logMax - logMin)) * 100

  return (
    <main ref={container}>
      <div className="ticker">Live preventable deaths (session model): {Math.floor(ticker).toLocaleString()}</div>
      <header>
        <h1>What Money Can Do</h1>
        <p>Choice → Dial → Futures → Ledger → Scale</p>
        <button onClick={() => setCurrency((c) => (c === 'INR' ? 'USD' : 'INR'))}>View in {currency === 'INR' ? 'USD' : 'INR'}</button>
      </header>

      <section>
        <h2>Act I — The Choice</h2>
        <p>Where do you want to help first?</p>
        <div className="grid">
          {regions.map((r) => (
            <button key={r.id} className={`card ${selected?.id === r.id ? 'active' : ''}`} onClick={() => setSelected(r)}>
              <h3>{r.name}</h3>
              <small>{r.stat}</small>
              <div className="need">
                {[
                  ['Health', r.healthIndex],
                  ['Education', r.educationIndex],
                  ['Poverty', r.povertyIndex]
                ].map(([name, val]) => (
                  <div key={name}>
                    <div className="chip"><span>{name}</span><b>{Math.round(val * 100)}</b></div>
                    <div className="track"><i style={{ width: `${val * 100}%`, background: r.color }} /></div>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Act II — The Dial</h2>
        <p>Starts at ₹1 lakh. Jump to $1M instantly.</p>
        <div className="dialRow">
          <button onClick={() => setBudget(1_000_000 * INR_PER_USD)}>Jump to $1M</button>
          <button onClick={() => setBudget(MIN_INR)}>Reset ₹1 lakh</button>
        </div>
        <strong>{fmtMoney(budget, currency)} / {fmtMoney(budget, currency === 'INR' ? 'USD' : 'INR')}</strong>
        <input type="range" min="0" max="100" step="0.1" value={slider} onChange={(e) => {
          const p = Number(e.target.value)
          setBudget(Math.round(10 ** (logMin + (p / 100) * (logMax - logMin))))
        }} />

        {impact && <div className="impact">
          <div><b>{impact.livesSaved.toLocaleString()}</b><span>lives saved</span></div>
          <div><b>{impact.ashaYears.toLocaleString()}</b><span>ASHA worker years</span></div>
          <div><b>{impact.mealYears.toLocaleString()}</b><span>child meal-years</span></div>
          <div><b>{impact.clinics.toLocaleString()}</b><span>clinics set up</span></div>
        </div>}
      </section>

      <section>
        <h2>Act III — The Futures</h2>
        <div className="tabs">
          {['sustained', 'plateau', 'collapsed'].map((s) => <button key={s} className={scenario === s ? 'active' : ''} onClick={() => setScenario(s)}>{s}</button>)}
        </div>
        {trends && <>
          <Heartbeat flatline={scenario === 'collapsed'} />
          <Spark data={trends[scenario]} color={scenario === 'collapsed' ? '#ff2a2a' : scenario === 'plateau' ? '#ffaa22' : '#22cc88'} />
        </>}
      </section>

      <section>
        <h2>Act IV — The Ledger</h2>
        <p>{fmtMoney(budget)} is <b>{percentOfTop10}%</b> of top-10 billionaire wealth.</p>
        <p className="closing">The money exists.<br />The knowledge exists.<br />The will does not.</p>
      </section>

      <section>
        <h2>Act V — The Scale Reveal</h2>
        <p>Each particle = ₹10 lakh equivalent in purchasing force.</p>
        <ParticleField intensity={1300} />
      </section>
    </main>
  )
}
