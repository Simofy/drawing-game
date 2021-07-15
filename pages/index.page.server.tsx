// Environment: Node.js

import fetch from 'node-fetch'

export { addPageContext }

async function addPageContext() {
  // `.page.server.js` files always run in Node.js; we could use SQL/ORM queries here.
  const response = await fetch(
    //@ts-ignore
    `http://localhost:${import.meta.env.VITE_PORT || 3000}/api/get-all`
  )
  let data = await response.json()

  const pageProps = { data }
  return { pageProps }
}
