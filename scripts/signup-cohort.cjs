// Read-only cohort audit. Uses record creation time, never the activity's backdated startTime.
const { MongoClient, ObjectId } = require('mongodb')
require('dotenv').config({ path: '.env.local', quiet: true })

function summarize(user, entries, asOf) {
  const signup = new Date(user.createdAt)
  const times = entries.map(e => new Date(e.createdAt)).filter(d =>
    Number.isFinite(d.getTime()) && d >= signup && d < asOf).sort((a, b) => a - b)
  const day = 86400000
  const age = asOf - signup
  return {
    userId: String(user._id),
    signedUpAt: signup.toISOString(),
    observedEntryCount: times.length,
    earliestSurvivingEntryCreatedAt: times[0]?.toISOString() || null,
    minutesToEarliestSurvivingEntry: times.length ? (times[0] - signup) / 60000 : null,
    entryWithin24Hours: times.some(t => t - signup < day) ? true : age >= day ? false : null,
    entryBetween24And48Hours: times.some(t => t - signup >= day && t - signup < 2 * day) ? true : age >= 2 * day ? false : null,
    entryOnLaterUtcDate: times.some(t => t.toISOString().slice(0, 10) > signup.toISOString().slice(0, 10)),
    applicationReturn: 'unknown: no authenticated visit history in current schema'
  }
}

async function main() {
  const [startArg, endArg, asOfArg, ...ids] = process.argv.slice(2)
  const start = new Date(startArg), end = new Date(endArg), asOf = new Date(asOfArg)
  if (![start, end, asOf].every(d => Number.isFinite(d.getTime())) || !(start < end && end <= asOf)) {
    throw new Error('Usage: node scripts/signup-cohort.cjs START_INCLUSIVE END_EXCLUSIVE AS_OF_EXCLUSIVE [userId ...]. Use explicit ISO timestamps with timezone.')
  }
  if (ids.some(id => !ObjectId.isValid(id))) throw new Error('Invalid user ID')
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required; use a read-only database account.')
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  try {
    await client.connect()
    const db = client.db()
    const filter = { createdAt: { $gte: start, $lt: end } }
    if (ids.length) filter._id = { $in: ids.map(id => new ObjectId(id)) }
    const users = await db.collection('users').find(filter, { projection: { _id: 1, createdAt: 1 } }).toArray()
    const rows = []
    for (const user of users) {
      const entries = await db.collection('timeentries').find({ userId: String(user._id), createdAt: { $gte: user.createdAt, $lt: asOf } }, { projection: { createdAt: 1 } }).toArray()
      rows.push(summarize(user, entries, asOf))
    }
    console.log(JSON.stringify({ start, end, asOf, matchedUsers: users.length, requestedUserIds: ids.length || null,
      caveats: ['Date-only selection includes all signup methods: provider is not persisted.', 'No surviving entries is not proof of never creating an entry: entries can be deleted.', 'Later entry creation proves a later write, not necessarily a separate session.', 'No entry titles, emails, names or credentials are output.'], rows }, null, 2))
  } finally { await client.close() }
}
if (require.main === module) main().catch(() => { console.error('Cohort audit failed. Check arguments, read-only database access and MONGODB_URI; credentials are not logged.'); process.exitCode = 1 })
module.exports = { summarize }
