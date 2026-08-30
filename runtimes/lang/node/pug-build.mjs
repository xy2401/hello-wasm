#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pug = require('pug')
const version = require('pug/package.json').version
const [input, output] = process.argv.slice(2)

if (input === '--version' || input === '-v') {
  console.log(version)
  process.exit(0)
}
if (!input || !output) {
  console.error('Usage: pug-build <input.pug> <output.html>')
  process.exit(64)
}

const target = path.resolve(output)
fs.mkdirSync(path.dirname(target), { recursive: true })
fs.writeFileSync(target, `${pug.renderFile(path.resolve(input), { pretty: true })}\n`)
