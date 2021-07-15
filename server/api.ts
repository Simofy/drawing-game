import { Express } from 'express'
import { Server } from 'http'
import { ObjectId } from 'mongodb'
import WebSocket from 'socket.io'

import { DrawingType } from '../pages/_default/types'
import mongoWrapper from './db'

export default function initApi(app: Express, server: Server) {
  const drawingsCollection = mongoWrapper.getCollection('drawings')

  const wsServer = new WebSocket.Server(server)
  // wsServer.on('connection', function connection(socket) {})

  if (drawingsCollection) {
    app.post('/api/update-drawing', async (req, res) => {
      const { id, path, user } = req.body as {
        id?: string
        path: DrawingType
        user: string
      }
      // broadcast to websocket
      if (!id) {
        const obj = await drawingsCollection.insertOne({
          paths: [path],
          user
        })
        wsServer.send(`UPDATED!${obj.insertedId.toHexString()}!0`)
        res.json({ id: obj.insertedId.toHexString() })
      } else {
        await drawingsCollection.updateOne(
          { _id: new ObjectId(String(id)) },
          {
            $push: {
              paths: path
            }
          }
        )
        const { paths } = (await drawingsCollection.findOne({
          _id: new ObjectId(String(id))
        })) || {
          paths: []
        }
        wsServer.send(`UPDATED!${id}!${paths.length - 1}`)
        res.json({ id })
      }
    })
    app.get('/api/get-single', async (req, res) => {
      const { id, index } = req.query
      const object = await drawingsCollection.findOne({
        _id: new ObjectId(String(id))
      })
      if (object) {
        const { paths } = object
        res.json(paths[Number(index)])
      } else {
        res.json(null)
      }
      // res.json(await drawingsCollection.find({}).toArray())
    })
    app.get('/api/get-all', async (req, res) => {
      res.json(await drawingsCollection.find({}).toArray())
    })
  }
}
