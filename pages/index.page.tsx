import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import io from 'socket.io-client'

import GameContext from './_default/GameContext'
import { DrawingType } from './_default/types'
import { randomHexColor } from './_helpers'
export { Game as Page }

enum MouseState {
  Down = 'mousedown',
  Up = 'mouseup',
  Leave = 'mouseleave',
  Enter = 'mouseenter',
  touchStart = 'touchstart',
  touchEnd = 'touchend',
  Default = 'default'
}

type ConfigType = {
  color: string
  stroke: number
}

function draw(ctx: CanvasRenderingContext2D, { color, path, stroke }: DrawingType) {
  ctx.strokeStyle = color
  ctx.lineWidth = stroke
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke(new Path2D(path))
}

const rangeCondition = (value: number, preValue: number, range: number) =>
  preValue + range > value && value > preValue - range

function HandleGameComponent({
  canvasContext,
  config
}: {
  config: ConfigType
  canvasContext: CanvasRenderingContext2D
}) {
  const { data } = useContext(GameContext)

  const currentDrawing = useMemo<{
    data: DrawingType[]
    lastIndex: number
    id?: string
  }>(
    () => ({
      data: [],
      lastIndex: 0
    }),
    []
  )

  const handleWebsocket = useCallback(async (wsData: string) => {
    const [type, id, index] = wsData.split('!')
    if (type === 'UPDATED' && id !== currentDrawing.id) {
      try {
        const response = await fetch(`/api/get-single?id=${id}&index=${index}`)
        const data = (await response.json()) as DrawingType
        if (data) {
          draw(canvasContext, data)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [])
  const ws = useMemo(() => {
    const webSocket = io({
      transports: ['websocket']
    })
    webSocket.connect()
    webSocket.on('message', handleWebsocket)
    return webSocket
  }, [])

  useEffect(() => {
    return () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    if (data?.length) {
      data.forEach(({ paths }) => {
        paths.forEach((path) => {
          draw(canvasContext, path)
        })
      })
    }
  }, [data])

  // Move to another comp
  const mouseState = useMemo(
    () => ({
      state: MouseState.Default,
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0
    }),
    []
  )

  const updateDrawing = useCallback(async () => {
    const response = await fetch('/api/update-drawing', {
      method: 'POST',
      body: JSON.stringify({
        id: currentDrawing.id,
        path: currentDrawing.data[currentDrawing.lastIndex],
        user: 'Julius'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const { id } = (await response.json()) as any
    if (id) {
      currentDrawing.id = id
    }
  }, [])
  const down = () => {
    canvasContext.strokeStyle = config.color
    canvasContext.lineWidth = config.stroke
    canvasContext.lineCap = 'round'
    canvasContext.lineJoin = 'round'

    canvasContext.beginPath()
    canvasContext.moveTo(mouseState.x, mouseState.y)

    currentDrawing.data.push({
      color: config.color,
      path: `M${Math.floor(mouseState.x)} ${mouseState.y}`,
      stroke: config.stroke
    })
    currentDrawing.lastIndex = currentDrawing.data.length - 1
  }
  const up = () => {
    canvasContext.lineTo(mouseState.x, mouseState.y)
    canvasContext.strokeStyle = config.color
    canvasContext.lineWidth = config.stroke
    canvasContext.stroke()
    currentDrawing.data[currentDrawing.lastIndex].path += ` L${Math.floor(
      mouseState.x
    )} ${mouseState.y}`
    updateDrawing()
  }
  const mouseCallbacks = useMemo<{ [key in MouseState]?: () => void }>(
    () => ({
      [MouseState.Down]: down,
      [MouseState.Up]: up,
      [MouseState.touchStart]: down,
      [MouseState.touchEnd]: up
    }),
    []
  )

  const demoDraw = useCallback((e: MouseEvent) => {
    if (mouseState.state === MouseState.Down) {
      const { clientX, clientY } = e
      mouseState.x = clientX
      mouseState.y = clientY
      if (
        !rangeCondition(clientX, mouseState.prevX, 10) ||
        !rangeCondition(clientY, mouseState.prevY, 10)
      ) {
        mouseState.prevX = mouseState.x
        mouseState.prevY = mouseState.y
        canvasContext.strokeStyle = config.color
        canvasContext.lineWidth = config.stroke
        canvasContext.lineTo(clientX, clientY)
        canvasContext.stroke()

        currentDrawing.data[currentDrawing.lastIndex].path += ` L${Math.floor(
          mouseState.x
        )} ${mouseState.y}`
      }
    }
  }, [])

  const demoDrawMobile = useCallback((e: TouchEvent) => {
    if (mouseState.state === MouseState.touchStart) {
      const { touches } = e
      if (touches.length) {
        mouseState.x = touches[0].clientX
        mouseState.y = touches[0].clientY
        if (
          !rangeCondition(touches[0].clientX, mouseState.prevX, 10) ||
          !rangeCondition(touches[0].clientY, mouseState.prevY, 10)
        ) {
          mouseState.prevX = mouseState.x
          mouseState.prevY = mouseState.y
          canvasContext.strokeStyle = config.color
          canvasContext.lineWidth = config.stroke
          canvasContext.lineTo(touches[0].clientX, touches[0].clientY)
          canvasContext.stroke()

          currentDrawing.data[currentDrawing.lastIndex].path += ` L${Math.floor(
            mouseState.x
          )} ${mouseState.y}`
        }
      }
    }
  }, [])

  const handleMouseState = useCallback(
    (state: MouseState, ...rest: [(() => void) | null, MouseEvent | TouchEvent]) => {
      const [callback, event] = rest
      const { x, y } = mouseState
      mouseState.prevX = x
      mouseState.prevY = y
      //@ts-ignore
      const { clientX, clientY, touches } = event
      if (touches && touches.length) {
        mouseState.x = touches[0].clientX
        mouseState.y = touches[0].clientY
      } else {
        mouseState.x = clientX
        mouseState.y = clientY
      }
      mouseState.state = state
      callback && callback()
    },
    []
  )
  useEffect(() => {
    const callbackRef: { listener: MouseState; callback: (arg: any) => void }[] = []
    Object.values(MouseState).forEach((value) => {
      if (value !== MouseState.Default) {
        const callback = handleMouseState.bind({}, value, mouseCallbacks[value] || null)
        document.addEventListener(value, callback)
        callbackRef.push({
          listener: value,
          callback
        })
      }
    })
    document.addEventListener('mousemove', demoDraw)
    document.addEventListener('touchmove', demoDrawMobile)
    return () => {
      callbackRef.forEach(({ listener, callback }) => {
        document.removeEventListener(listener, callback)
      })
      document.removeEventListener('mousemove', demoDraw)
      document.removeEventListener('touchmove', demoDrawMobile)
    }
  }, [])
  return null
}

export default function Game() {
  const gameRef = useRef<HTMLCanvasElement>(null)
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(
    null
  )
  const config = useMemo(
    () => ({
      color: randomHexColor(),
      stroke: 2
    }),
    []
  )
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.width = window.innerWidth
      gameRef.current.height = window.innerHeight
      const ctx = gameRef.current.getContext('2d')
      setCanvasContext(ctx)
      let timeoutId: number | null
      let currentDrawing: ImageData | null
      window.addEventListener('resize', () => {
        if (gameRef.current && ctx) {
          if (!timeoutId) {
            currentDrawing = ctx.getImageData(
              0,
              0,
              gameRef.current.width,
              gameRef.current.height
            )
          }
          timeoutId && clearTimeout(timeoutId)
          setTimeout(() => {
            timeoutId = null
            if (gameRef.current && ctx && currentDrawing) {
              gameRef.current.width = window.innerWidth
              gameRef.current.height = window.innerHeight
              ctx?.putImageData(currentDrawing, 0, 0)
            }
          }, 500)
        }
      })
    }
  }, [gameRef])

  return (
    <>
      <canvas className="canvas" ref={gameRef} />
      {canvasContext && (
        <HandleGameComponent canvasContext={canvasContext} config={config} />
      )}
      <GameTooltip config={config} />
    </>
  )
}

function GameTooltip({
  config
}: {
  config: {
    color: string
    stroke: number
  }
}) {
  return (
    <div className="game-tooltip">
      <label htmlFor="color">Color</label>
      <input
        name="color"
        type="color"
        defaultValue={config.color}
        onChange={({ target: { value } }) => (config.color = value)}
      />
      <label htmlFor="stroke">Stroke</label>
      <input
        name="stroke"
        type="range"
        min="1"
        max="20"
        defaultValue={config.stroke}
        onChange={({ target: { value } }) => (config.stroke = Number(value))}
      />
    </div>
  )
}
