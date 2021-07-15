import React from 'react'
import ReactDOM from 'react-dom'
//@ts-ignore
import { getPage } from 'vite-plugin-ssr/client'

import { GameWrapper } from './GameWrapper'

async function hydrate() {
  const pageContext = await getPage()
  const {
    Page,
    pageProps: { data, pageProps }
  } = pageContext
  ReactDOM.hydrate(
    <GameWrapper data={data}>
      <Page {...pageProps} />
    </GameWrapper>,
    document.getElementById('app')
  )
}

hydrate()
