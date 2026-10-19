const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
test('server analytics serialize GA4 params, without changing helper inputs', async () => {
  const compiled = ts.transpileModule(fs.readFileSync('src/lib/analytics.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  let body
  const context = { exports: {}, process: { env: { NODE_ENV: 'production', GA4_API_SECRET: 'test-only' } }, console, fetch: async (_url, options) => { body = JSON.parse(options.body); return { ok: true } } }
  vm.runInNewContext(compiled, context)
  await context.exports.trackServerEvent('test-client', 'test-user', [{ name: 'task_milestone_reached', parameters: { milestone_count: 3 } }])
  assert.equal(body.events[0].params.milestone_count, 3)
  assert.equal(body.events[0].params.engagement_time_msec, 100)
  assert.equal(body.events[0].parameters, undefined)
})
