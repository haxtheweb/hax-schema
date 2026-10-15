#!/usr/bin/env node
/**
 * Self-test: valid examples must pass, files under examples/invalid must
 * fail with the expected messages.
 */
const path = require('path')
const { buildValidators, validateFile } = require('./validate.js')

const root = path.join(__dirname, '..')
const validators = buildValidators()
let failures = 0

const check = (file, expectValid, expectMessages = []) => {
  const r = validateFile(path.join(root, file), validators)
  const text = r.errors.map((e) => `${e.path}: ${e.message}`).join('\n')
  const okValid = expectValid ? r.errors.length === 0 : r.errors.length > 0
  const missing = expectMessages.filter((m) => !text.includes(m))
  if (!okValid || missing.length) {
    failures++
    console.log(`FAIL ${file}`)
    if (!okValid) console.log(`  expected ${expectValid ? 'valid' : 'invalid'}; errors:\n    ${text.split('\n').join('\n    ')}`)
    for (const m of missing) console.log(`  missing expected error containing "${m}"`)
  } else {
    console.log(`ok   ${file}`)
  }
}

check('example.json', true)
check('examples/lib/feature-card.haxProperties.json', true)
check('examples/lib/two-column-layout.haxProperties.json', true)
check('examples/locales/feature-card.es.haxProperties.json', true)
check('examples/invalid/lib/common-mistakes.haxProperties.json', false, [
  '"desc"; prefix custom keys with "x-"',
  'textfield, textarea',
  'needs "options" or "itemsList"',
  '/settings/configure/2: field must target',
  '/settings: must NOT have additional properties ("saveOptions"',
  '/saveOptions/unsetAttributes/0: unsetAttributes entries are dash-case',
  'need at least one demoSchema entry'
])
check('examples/invalid/locales/common-mistakes.fr.haxProperties.json', false, [
  '("developer")',
  'entry 3 has no field at that index'
])
process.exitCode = failures ? 1 : 0
