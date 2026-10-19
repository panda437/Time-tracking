const test = require('node:test')
const assert = require('node:assert/strict')
const { summarize } = require('./signup-cohort.cjs')
const user = { _id: 'user-1', createdAt: '2026-10-08T10:00:00Z' }
test('creation timestamps determine activation despite backdated activities', () => {
  const result = summarize(user, [{ createdAt: '2026-10-09T10:00:00Z', startTime: '2026-10-01T10:00:00Z' }], new Date('2026-10-11T10:00:00Z'))
  assert.equal(result.entryWithin24Hours, false)
  assert.equal(result.entryBetween24And48Hours, true)
  assert.equal(result.minutesToEarliestSurvivingEntry, 1440)
})
test('incomplete observation windows remain unknown rather than failed', () => {
  const result = summarize(user, [], new Date('2026-10-08T12:00:00Z'))
  assert.equal(result.entryWithin24Hours, null)
  assert.equal(result.entryBetween24And48Hours, null)
  assert.equal(result.earliestSurvivingEntryCreatedAt, null)
})
test('as-of is exclusive; invalid and pre-signup dates do not count', () => {
  const result = summarize(user, [{ createdAt: 'bad' }, { createdAt: '2026-10-07T00:00:00Z' }, { createdAt: '2026-10-10T10:00:00Z' }], new Date('2026-10-10T10:00:00Z'))
  assert.equal(result.observedEntryCount, 0)
  assert.equal(result.entryBetween24And48Hours, false)
})
