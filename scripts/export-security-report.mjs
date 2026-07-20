#!/usr/bin/env node
/**
 * Optional: export Enterprise Security Report to a simple text/PDF-friendly file.
 * Usage: node scripts/export-security-report.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'docs/53_ENTERPRISE_SECURITY_REPORT.md')
const outDir = path.join(root, 'docs/exports')
const out = path.join(outDir, '53_ENTERPRISE_SECURITY_REPORT.txt')

fs.mkdirSync(outDir, { recursive: true })
const md = fs.readFileSync(src, 'utf8')
fs.writeFileSync(out, md)
console.log(`Wrote ${out}`)
console.log('For PDF: open the Markdown in a printer or pandoc docs/53_ENTERPRISE_SECURITY_REPORT.md -o report.pdf')
