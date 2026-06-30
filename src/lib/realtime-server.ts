import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export function initWebSocket(httpServer: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string
    if (userId) {
      socket.join(`user:${userId}`)
    }

    socket.on('join-user', (uid: string) => {
      socket.join(`user:${uid}`)
    })

    socket.on('disconnect', () => {})
  })

  return io
}

export function getIO(): SocketIOServer | null {
  return io
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data)
  }
}

export function emitToAll(event: string, data: any) {
  if (io) {
    io.emit(event, data)
  }
}
