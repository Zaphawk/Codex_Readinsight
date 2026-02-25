import express from 'express'

const app = express()
const port = process.env.PORT || 8787

const regions = [
  { id: 'mumbai-slums', name: 'Mumbai Informal Settlements', population: '9M', stat: '1 in 3 children has growth stunting risk', healthIndex: 0.82, educationIndex: 0.61, povertyIndex: 0.72, color: '#ff2a2a' },
  { id: 'rural-maharashtra', name: 'Rural Maharashtra', population: '62M', stat: 'PHCs often cover 30k+ people each', healthIndex: 0.74, educationIndex: 0.59, povertyIndex: 0.63, color: '#ff6347' },
  { id: 'bihar', name: 'Bihar', population: '128M', stat: 'High maternal and child mortality burden', healthIndex: 0.89, educationIndex: 0.85, povertyIndex: 0.9, color: '#ff4444' },
  { id: 'tribal-india', name: 'Central Tribal Belt (India)', population: '84M', stat: 'Severe health access gaps in remote blocks', healthIndex: 0.91, educationIndex: 0.8, povertyIndex: 0.87, color: '#ff3a30' },
  { id: 'sub-saharan-africa', name: 'Sub-Saharan Africa', population: '1.2B', stat: '1 in 13 children dies before age 5', healthIndex: 0.92, educationIndex: 0.85, povertyIndex: 0.88, color: '#ff1a1a' }
]

const unitCosts = {
  ashaWorkerYear: { label: 'ASHA worker stipend (1 year)', usd: 420, inr: 35000 },
  middayMeals: { label: 'Mid-day meals (child/year)', usd: 33, inr: 2750 },
  clinicSetup: { label: 'Urban health clinic setup', usd: 54000, inr: 4500000 },
  safeWater: { label: 'Household water connection support', usd: 180, inr: 15000 },
  deworming: { label: 'Deworming dose', usd: 0.24, inr: 20 },
  lifeSaved: { label: 'Estimated life saved', usd: 3500, inr: 290000 }
}

app.get('/api/regions', (_, res) => res.json(regions))
app.get('/api/unit-costs', (_, res) => res.json(unitCosts))
app.get('/api/mortality', (_, res) => {
  // configurable deaths/min baseline inspired by WHO preventable mortality aggregates
  res.json({
    source: 'WHO-style preventable mortality aggregate model',
    preventableDeathsPerMinute: 19,
    updatedAt: new Date().toISOString()
  })
})

app.listen(port, () => {
  console.log(`API server listening on ${port}`)
})
