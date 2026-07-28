import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_MORTALITY_RATE, loadImpactData } from '../src/loadImpactData.js'

const regions = [{ id: 'bihar', name: 'Bihar' }]
const costs = { lifeSaved: { inr: 290000 } }

function response(value, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() {
      return value
    }
  }
}

function fetchWith(overrides = {}) {
  const payloads = {
    '/api/regions': response(regions),
    '/api/unit-costs': response(costs),
    '/api/mortality': response({ preventableDeathsPerMinute: 19 }),
    ...overrides
  }

  return async (endpoint) => {
    const result = payloads[endpoint]
    if (result instanceof Error) throw result
    return result
  }
}

test('a mortality outage preserves regions and unit costs while using the safe default', async () => {
  const result = await loadImpactData(fetchWith({
    '/api/mortality': new Error('temporary outage')
  }))

  assert.deepEqual(result.regions, regions)
  assert.deepEqual(result.costs, costs)
  assert.equal(result.mortalityRate, DEFAULT_MORTALITY_RATE)
  assert.deepEqual(result.unavailable, ['mortality rate'])
})

test('one failed core endpoint does not discard other successful responses', async () => {
  const result = await loadImpactData(fetchWith({
    '/api/regions': response(null, { ok: false, status: 503 })
  }))

  assert.deepEqual(result.regions, [])
  assert.deepEqual(result.costs, costs)
  assert.equal(result.mortalityRate, 19)
  assert.deepEqual(result.unavailable, ['regions'])
})

test('healthy endpoints load without fallbacks', async () => {
  const result = await loadImpactData(fetchWith())

  assert.deepEqual(result, {
    regions,
    costs,
    mortalityRate: 19,
    unavailable: []
  })
})
