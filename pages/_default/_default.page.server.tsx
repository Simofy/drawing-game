import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { html } from 'vite-plugin-ssr'

//@ts-ignore
import style from './../style/main.scss'
import { GameWrapper } from './GameWrapper'

// See https://github.com/brillout/vite-plugin-ssr#data-fetching
const passToClient = ['pageProps']

// const isProduction = process.env.NODE_ENV === 'production'
function renderCSS() {
  // if (isProduction) {
  //   return `<style>${style}</style>`
  // }
  return `<style>${style}</style>`
}

function render(pageContext: any) {
  const {
    Page,
    pageProps: { data, ...pageProps }
  } = pageContext
  const pageHtml = ReactDOMServer.renderToString(
    <GameWrapper data={data}>
      <Page {...pageProps} />
    </GameWrapper>
  )
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="author" content="Julius Simas Simutis" />
        <meta
          name="description"
          content="Demo drawing game using Vite/SSR/mongoDB/websocket. You can find this repo in: "
        />
        <title>Drawing game</title>
        ${html.dangerouslySkipEscape(renderCSS())}
      </head>
      <body>
        <div id="app">${html.dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`
}

export { passToClient, render }
