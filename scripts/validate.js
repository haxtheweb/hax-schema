#!/usr/bin/env node
/**
 * Validate haxProperties files against schema/ plus checks JSON Schema
 * cannot express.
 *
 * Usage:
 *   node scripts/validate.js [--json] [--strict] [--base <file>] <file> [file...]
 *
 * Files inside a `locales/` folder, or named `<tag>.<lang>.haxProperties.json`,
 * are validated as translation overlays. When the matching base file
 * (`../lib/<tag>.haxProperties.json`, or --base) exists, the overlay is also
 * checked for index alignment with it.
 *
 * --json    machine-readable report (one object per file)
 * --strict  treat warnings as errors
 * Exit code: 0 when every file is valid, 1 otherwise.
 */
const fs = require('fs')
const path = require('path')
const Ajv2020 = require('ajv/dist/2020')

const SCHEMA_DIR = path.join(__dirname, '..', 'schema')

function buildValidators () {
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  const load = (f) => JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, f), 'utf8'))
  return {
    element: ajv.compile(load('haxProperties.schema.json')),
    locale: ajv.compile(load('haxProperties.locale.schema.json'))
  }
}

const LOCALE_NAME = /^(.+)\.([a-z]{2,3}(?:[-_][A-Za-z]{2,4})?)\.haxProperties\.json$/

function detectType (file) {
  const name = path.basename(file)
  if (file.split(path.sep).includes('locales') || LOCALE_NAME.test(name)) return 'locale'
  return 'element'
}

function findBase (file) {
  const m = LOCALE_NAME.exec(path.basename(file))
  if (!m) return null
  const dir = path.dirname(file)
  const candidates = [
    path.join(dir, '..', 'lib', `${m[1]}.haxProperties.json`),
    path.join(dir, '..', `${m[1]}.haxProperties.json`)
  ]
  return candidates.find((c) => fs.existsSync(c)) || null
}

const fieldTarget = (f) => (f.property !== undefined ? `property:${f.property}` : f.attribute !== undefined ? `attribute:${f.attribute}` : `slot:${f.slot}`)

function walkFields (list, base, cb) {
  if (!Array.isArray(list)) return
  list.forEach((f, i) => {
    if (!f || typeof f !== 'object') return
    cb(f, `${base}/${i}`)
    if (Array.isArray(f.properties)) walkFields(f.properties, `${base}/${i}/properties`, cb)
  })
}

/** Extra checks for an element (base) file. */
function elementChecks (doc) {
  const errors = []
  const warnings = []
  const settings = doc.settings || {}
  const known = new Set()
  for (const group of Object.keys(settings)) {
    if (!Array.isArray(settings[group])) continue
    const seen = new Map()
    ;(settings[group] || []).forEach((f, i) => {
      if (!f || typeof f !== 'object') return
      const key = fieldTarget(f)
      if (seen.has(key)) warnings.push({ path: `/settings/${group}/${i}`, message: `${key} is already edited by /settings/${group}/${seen.get(key)}` })
      else seen.set(key, i)
    })
    walkFields(settings[group], `/settings/${group}`, (f, p) => {
      if (f.property !== undefined) known.add(f.property)
      if (f.attribute !== undefined) known.add(f.attribute)
      const nested = ['array', 'object', 'fieldset', 'tabs', 'collapse']
      if (nested.includes(f.inputMethod) && !Array.isArray(f.properties)) {
        warnings.push({ path: p, message: `inputMethod "${f.inputMethod}" groups sub-fields but has no "properties" array` })
      }
      if ((f.inputMethod === 'select' || f.inputMethod === 'radio') && !f.options && !f.itemsList) {
        errors.push({ path: p, message: `inputMethod "${f.inputMethod}" needs "options" or "itemsList"` })
      }
      if (f.property !== undefined && /-/.test(f.property)) {
        warnings.push({ path: `${p}/property`, message: `property "${f.property}" looks dash-case; use the camelCase JS property name, or "attribute" for an HTML attribute` })
      }
    })
  }
  if (doc.gizmo && Array.isArray(doc.demoSchema) && doc.demoSchema.length === 0) {
    errors.push({ path: '/demoSchema', message: 'insertable elements (with a gizmo) need at least one demoSchema entry; the first one is what HAX inserts' })
  }
  ;(doc.demoSchema || []).forEach((d, i) => {
    if (!d || !d.properties) return
    for (const k of Object.keys(d.properties)) {
      if (known.size && !known.has(k) && !['id', 'class', 'style'].includes(k) && !k.startsWith('data-')) {
        warnings.push({ path: `/demoSchema/${i}/properties/${k}`, message: `"${k}" is not edited by any settings field (fine for fixed demo values, otherwise a typo)` })
      }
    }
  })
  return { errors, warnings }
}

/** Extra checks for a locale overlay against its base file. */
function localeChecks (doc, base) {
  const errors = []
  const warnings = []
  if (!base) return { errors, warnings }
  for (const group of ['configure', 'advanced']) {
    const tr = (doc.settings || {})[group]
    if (!tr) continue
    const orig = (base.settings || {})[group] || []
    if (tr.length > orig.length) {
      errors.push({ path: `/settings/${group}`, message: `${tr.length} entries but the base file has ${orig.length}; overlays merge by index` })
    }
    tr.forEach((t, i) => {
      const o = orig[i]
      if (o && t && t.options && !o.options) warnings.push({ path: `/settings/${group}/${i}/options`, message: 'base field has no options to translate' })
      if (o && t && t.options && o.options) {
        for (const k of Object.keys(t.options)) if (!(k in o.options)) warnings.push({ path: `/settings/${group}/${i}/options/${k}`, message: `option value "${k}" does not exist in the base field` })
      }
    })
  }
  if (Array.isArray(doc.demoSchema)) {
    const orig = base.demoSchema || []
    if (doc.demoSchema.length > orig.length) errors.push({ path: '/demoSchema', message: `${doc.demoSchema.length} entries but the base file has ${orig.length}` })
    doc.demoSchema.forEach((d, i) => {
      if (!d || !d.properties || !orig[i]) return
      for (const k of Object.keys(d.properties)) {
        if (!(k in (orig[i].properties || {}))) warnings.push({ path: `/demoSchema/${i}/properties/${k}`, message: `"${k}" is not set in the base demo, so it will be added rather than translated` })
      }
    })
  }
  if (doc.gizmo && !base.gizmo) warnings.push({ path: '/gizmo', message: 'base file has no gizmo; this translation is unused' })
  return { errors, warnings }
}

function formatAjv (errors) {
  const list = errors || []
  // a field with none of property/attribute/slot produces 4 errors; report one
  const anyOfPaths = new Set(list.filter((e) => e.keyword === 'anyOf').map((e) => e.instancePath))
  return list
    .filter((e) => !(e.keyword === 'required' && anyOfPaths.has(e.instancePath)))
    .map((e) => {
      let msg = e.message
      if (e.keyword === 'anyOf' && /\/settings\//.test(e.instancePath)) {
        msg = 'field must target "property", "attribute" or "slot" (HAX drops it otherwise)'
      } else if (e.keyword === 'pattern' && /\/unsetAttributes\//.test(e.instancePath)) {
        msg = 'unsetAttributes entries are dash-case attribute names (for example "element-visible", not "elementVisible"); camelCase entries never match and are ignored'
      }
      if (e.params && e.params.additionalProperty) msg += ` ("${e.params.additionalProperty}")`
      if (e.params && e.params.unevaluatedProperty) msg += ` ("${e.params.unevaluatedProperty}")`
      if (e.params && e.params.allowedValues) msg += `: ${e.params.allowedValues.join(', ')}`
      return { path: e.instancePath || '/', message: msg }
    })
}

function validateFile (file, validators, baseOverride) {
  const type = detectType(file)
  let doc
  try {
    doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    return { file, type, valid: false, errors: [{ path: '/', message: `cannot read JSON: ${e.message}` }], warnings: [] }
  }
  const v = validators[type]
  v(doc)
  let errors = formatAjv(v.errors)
  let warnings = []
  if (type === 'element') {
    const r = elementChecks(doc)
    errors = errors.concat(r.errors)
    warnings = r.warnings
  } else {
    const basePath = baseOverride || findBase(file)
    let base = null
    if (basePath) {
      try { base = JSON.parse(fs.readFileSync(basePath, 'utf8')) } catch (e) {}
    } else {
      warnings.push({ path: '/', message: 'base haxProperties file not found; skipped index-alignment checks (use --base)' })
    }
    const r = localeChecks(doc, base)
    errors = errors.concat(r.errors)
    warnings = warnings.concat(r.warnings)
  }
  return { file, type, errors, warnings }
}

function main (argv) {
  const args = argv.slice(2)
  let asJson = false
  let strict = false
  let base = null
  const files = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') asJson = true
    else if (args[i] === '--strict') strict = true
    else if (args[i] === '--base') base = args[++i]
    else if (args[i] === '-h' || args[i] === '--help') {
      console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0])
      return 0
    } else files.push(args[i])
  }
  if (!files.length) {
    console.error('usage: validate.js [--json] [--strict] [--base <file>] <file> [file...]')
    return 2
  }
  const validators = buildValidators()
  const reports = files.map((f) => {
    const r = validateFile(f, validators, base)
    r.valid = r.errors.length === 0 && (!strict || r.warnings.length === 0)
    return r
  })
  if (asJson) console.log(JSON.stringify(reports, null, 2))
  else {
    for (const r of reports) {
      console.log(`${r.valid ? 'PASS' : 'FAIL'} ${r.file} (${r.type})`)
      for (const e of r.errors) console.log(`  error   ${e.path}: ${e.message}`)
      for (const w of r.warnings) console.log(`  warning ${w.path}: ${w.message}`)
    }
  }
  return reports.every((r) => r.valid) ? 0 : 1
}

module.exports = { buildValidators, detectType, validateFile }

if (require.main === module) {
  process.exitCode = main(process.argv)
}
