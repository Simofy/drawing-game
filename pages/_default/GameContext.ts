import { createContext } from 'react'

import { IGameContext } from './types'

const GameContext = createContext<IGameContext>({
  data: []
})

export default GameContext
