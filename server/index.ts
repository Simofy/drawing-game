import express from 'express'
import { createPageRender } from 'vite-plugin-ssr'

import initApi from './api'
import mongoWrapper from './db'

const isProduction = process.env.NODE_ENV === 'production'
const root = `${__dirname}/..`

require('dotenv').config()

mongoWrapper.open().then(() => {
  startServer()
})

async function startServer() {
  const app = express()
  const port = process.env.VITE_PORT || 3000
  const server = app.listen(port)

  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())

  let viteDevServer
  if (isProduction) {
    app.use(express.static(`${root}/dist/client`, { index: false }))
  } else {
    const vite = require('vite')
    viteDevServer = await vite.createServer({
      root,
      server: { middlewareMode: true }
    })
    app.use(viteDevServer.middlewares)
  }

  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS, PUT, PATCH, DELETE'
    ) // If needed
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type') // If needed
    res.setHeader('Access-Control-Allow-Credentials', 'true') // If needed
    next()
  })

  const renderPage = createPageRender({ viteDevServer, isProduction, root })

  app.get('/api/test', async (req, res) => {
    res.json({ test: '123' })
  })

  initApi(app, server)

  app.get('*', async (req, res, next) => {
    const url = req.originalUrl
    const pageContext = {
      url
    }
    const result = await renderPage(pageContext)
    if (result.nothingRendered) return next()
    res.status(result.statusCode).send(result.renderResult)
  })

  console.log(`Server running at http://localhost:${port}`)
}
