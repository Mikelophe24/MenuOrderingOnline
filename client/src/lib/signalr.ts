import * as signalR from '@microsoft/signalr'
import { getAccessToken } from '@/lib/tokens'

let connection: signalR.HubConnection | null = null

function createConnection(): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${process.env.NEXT_PUBLIC_SIGNALR_URL}/hubs/order`, {
      accessTokenFactory: () => getAccessToken() ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()
}

export function getConnection(): signalR.HubConnection {
  if (!connection) {
    connection = createConnection()
  }
  return connection
}

export async function startConnection(): Promise<signalR.HubConnection | null> {
  const conn = getConnection()

  if (conn.state === signalR.HubConnectionState.Connected) {
    return conn
  }

  if (conn.state !== signalR.HubConnectionState.Disconnected) {
    return null
  }

  try {
    await conn.start()
    console.log('SignalR Connected')
    return conn
  } catch (err) {
    console.warn('SignalR connection failed:', err)
    return null
  }
}

export async function stopConnection() {
  if (connection) {
    try {
      await connection.stop()
    } catch {
      // ignore
    }
    connection = null
  }
}
