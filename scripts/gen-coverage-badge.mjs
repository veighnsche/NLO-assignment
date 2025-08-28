#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

function getCoveragePct() {
  try {
    const summary = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf-8'))
    const pct = summary?.total?.lines?.pct
    if (typeof pct === 'number' && !Number.isNaN(pct)) return Math.round(pct)
  } catch {}
  return 0
}

function colorFor(p) {
  if (p >= 90) return '#4c1' // brightgreen
  if (p >= 80) return '#97CA00' // green
  if (p >= 70) return '#a4a61d' // yellowgreen
  if (p >= 60) return '#dfb317' // yellow
  return '#e05d44' // red
}

function makeBadge(label, value, color) {
  // Simple static-width badge to avoid complex text width calc
  const left = label
  const right = value
  const leftWidth = 70
  const rightWidth = 54
  const total = leftWidth + rightWidth
  const labelColor = '#555'
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="${left}: ${right}">
  <title>${left}: ${right}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="m">
    <rect width="${total}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#m)">
    <rect width="${leftWidth}" height="20" fill="${labelColor}"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${color}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${leftWidth/2}" y="15" fill="#010101" fill-opacity=".3">${left}</text>
    <text x="${leftWidth/2}" y="14">${left}</text>
    <text x="${leftWidth + rightWidth/2}" y="15" fill="#010101" fill-opacity=".3">${right}</text>
    <text x="${leftWidth + rightWidth/2}" y="14">${right}</text>
  </g>
</svg>`
}

function main() {
  const pct = getCoveragePct()
  const color = colorFor(pct)
  const svg = makeBadge('coverage', `${pct}%`, color)
  const out = 'public/coverage.svg'
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, svg)
  console.log(`Generated ${out} with ${pct}%`)
}

main()
