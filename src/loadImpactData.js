export const DEFAULT_MORTALITY_RATE = 12

async function fetchJson(fetchImpl, endpoint) {
  const response = await fetchImpl(endpoint)
  if (!response.ok) {
    throw new Error(`${endpoint} returned ${response.status}`)
  }
  return response.json()
}

function usable(result, validate) {
  return result.status === 'fulfilled' && validate(result.value)
}

export async function loadImpactData(fetchImpl = globalThis.fetch) {
  const [regionsResult, costsResult, mortalityResult] = await Promise.allSettled([
    fetchJson(fetchImpl, '/api/regions'),
    fetchJson(fetchImpl, '/api/unit-costs'),
    fetchJson(fetchImpl, '/api/mortality')
  ])

  const hasRegions = usable(regionsResult, Array.isArray)
  const hasCosts = usable(costsResult, (value) => value !== null && typeof value === 'object')
  const hasMortality = usable(
    mortalityResult,
    (value) => Number.isFinite(value?.preventableDeathsPerMinute) && value.preventableDeathsPerMinute >= 0
  )

  return {
    regions: hasRegions ? regionsResult.value : [],
    costs: hasCosts ? costsResult.value : null,
    mortalityRate: hasMortality ? mortalityResult.value.preventableDeathsPerMinute : DEFAULT_MORTALITY_RATE,
    unavailable: [
      ...(!hasRegions ? ['regions'] : []),
      ...(!hasCosts ? ['unit costs'] : []),
      ...(!hasMortality ? ['mortality rate'] : [])
    ]
  }
}
