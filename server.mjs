import express from 'express'
import { handler as ssrHandler } from './dist/server/entry.mjs'

const app = express()
// Change this based on your astro.config.mjs, `base` option.
// They should match. The default value is "/".
const base = '/'
app.use(base, express.static('dist/client/'))
app.use(ssrHandler)

const port = Number(process.env.PORT) || 8080

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`)
  } else if (err.code === 'EACCES') {
    console.error(`Permission denied to bind port ${port}`)
  } else {
    console.error('Server error:', err.message)
  }
  process.exit(1)
}) 