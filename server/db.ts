import { Collection, Db, MongoClient } from 'mongodb'

import { IGameContext } from '../pages/_default/types'

const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'

type DrawingCollection = Collection<Omit<IGameContext['data'][0], '_id'>>
const mongoWrapper: {
  client?: MongoClient
  db?: Db
  drawingsCollection?: DrawingCollection
  getDb: () => Db | null
  getCollection: (collection: 'drawings') => DrawingCollection | null
  open: () => Promise<MongoClient>
} = {
  client: undefined,
  db: undefined,
  drawingsCollection: undefined,
  async open() {
    if (this.client) return this.client
    this.client = await MongoClient.connect(url)
    console.log('Successfully connected to mongodb')
    return this.client
  },
  getDb() {
    if (this.db) return this.db
    if (!this.client) return null
    this.db = this.client.db('drawing-game')

    return this.db
  },
  getCollection(collection) {
    if (this.drawingsCollection) return this.drawingsCollection
    if (!this.client) return null
    const db = this.getDb()
    if (!db) return null

    this.drawingsCollection = db.collection(collection)
    return this.drawingsCollection
  }
}

export default mongoWrapper
