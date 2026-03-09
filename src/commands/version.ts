import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGE_JSON = join(process.cwd(), 'package.json')

export type VersionBump = 'patch' | 'minor' | 'major'

function parseVersion(v: string): [number, number, number] {
  const parts = v.replace(/^v/, '').split('.').map(Number)
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
}

function bump(version: string, type: VersionBump): string {
  const [major, minor, patch] = parseVersion(version)
  if (type === 'major') return `${major + 1}.0.0`
  if (type === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

export const versionCommand = () => {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8'))
  console.log(`v${pkg.version}`)
}

export const versionUpdateCommand = async (updateType: VersionBump) => {
  const path = PACKAGE_JSON
  const pkg = JSON.parse(readFileSync(path, 'utf-8'))
  const current = pkg.version || '0.0.0'
  const next = bump(current, updateType)
  pkg.version = next
  writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
  console.log(`${current} → ${next} (${updateType})`)
}
