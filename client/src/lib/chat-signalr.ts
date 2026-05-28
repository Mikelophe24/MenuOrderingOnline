import * as signalR from '@microsoft/signalr'
import { getAccessToken } from '@/lib/tokens'

/**
 * SignalR connection cho ChatHub.
 *  - Anon user: khong can token, join group "chat-{token}" voi sessionToken cua minh.
 *  - Staff: dung accessToken, join group "staff-chats" de nhan escalation moi.
 *
 * Tach rieng khoi `lib/signalr.ts` (cua OrderHub) vi lifecycle khac nhau.
 */

let connection: signalR.HubConnection | null = null
let startPromise: Promise<signalR.HubConnection | null> | null = null

// Retry forever (max 30s giua cac lan). Tranh truong hop backend restart → client chet vinh vien.
const infiniteRetryPolicy: signalR.IRetryPolicy = {
  nextRetryDelayInMilliseconds: (ctx) => {
    // Exponential backoff 1s → 30s
    return Math.min(30_000, 1000 * Math.pow(2, Math.min(ctx.previousRetryCount, 5)))
  },
}

function createConnection(): signalR.HubConnection {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(`${process.env.NEXT_PUBLIC_SIGNALR_URL}/hubs/chat`, {
      accessTokenFactory: () => getAccessToken() ?? '',
    })
    .withAutomaticReconnect(infiniteRetryPolicy)
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  // Final safety net: neu reconnect policy het thi van co gang restart sau 5s.
  conn.onclose(() => {
    setTimeout(() => {
      if (conn.state === signalR.HubConnectionState.Disconnected) {
        conn.start().catch(() => undefined)
      }
    }, 5_000)
  })

  return conn
}

export function getChatConnection(): signalR.HubConnection {
  if (!connection) {
    connection = createConnection()
  }
  return connection
}

export async function startChatConnection(): Promise<signalR.HubConnection | null> {
  const conn = getChatConnection()

  if (conn.state === signalR.HubConnectionState.Connected) return conn
  if (startPromise) return startPromise
  if (conn.state !== signalR.HubConnectionState.Disconnected) return null

  startPromise = conn
    .start()
    .then(() => conn)
    .catch((err) => {
      console.warn('ChatHub connection failed:', err)
      return null
    })
    .finally(() => {
      startPromise = null
    })

  return startPromise
}

export async function stopChatConnection() {
  if (connection) {
    try {
      await connection.stop()
    } catch {
      // ignore
    }
    connection = null
  }
}
