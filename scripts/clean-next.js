const fs = require('fs')
const path = require('path')

function removeDir(targetPath) {
  if (!fs.existsSync(targetPath)) return
  try {
    fs.rmSync(targetPath, { recursive: true, force: true })
    console.log('Removed:', targetPath)
  } catch (err) {
    console.error('Failed to remove', targetPath, err)
    process.exitCode = 1
  }
}

const repoRoot = path.resolve(__dirname, '..')
const nextDir = path.join(repoRoot, '.next')
const cacheDir = path.join(repoRoot, 'node_modules', '.cache')

removeDir(nextDir)
removeDir(cacheDir)

// also remove .vercel_build_output if present (sometimes used by Vercel builds)
removeDir(path.join(repoRoot, '.vercel_build_output'))

console.log('Clean finished.')
