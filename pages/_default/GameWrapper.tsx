import React from 'react'

import GameContext from './GameContext'
import { IGameContext } from './types'

type Children = React.ReactNode

function GameWrapper({
  children,
  data
}: {
  children: Children
  data: IGameContext['data']
}) {
  return (
    <React.StrictMode>
      <div className="app">
        <GameContext.Provider value={{ data }}>{children}</GameContext.Provider>
      </div>
    </React.StrictMode>
  )
}

export { GameWrapper }
