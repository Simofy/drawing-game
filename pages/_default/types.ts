export type DrawingType = {
  color: string
  path: string
  stroke: number
}
export interface IGameContext {
  data: {
    user: string
    _id: string
    paths: DrawingType[]
  }[]
}
