import * as signalR from '@microsoft/signalr'

let connection: signalR.HubConnection | null = null
let retryTimeout: ReturnType<typeof setTimeout> | null = null

function createConnection(): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${process.env.NEXT_PUBLIC_SIGNALR_URL}/hubs/order`, {
      accessTokenFactory: () => {
        const raw =
          document.cookie
            .split('; ')
            .find((row) => row.startsWith('accessToken='))
            ?.split('=')[1] ?? ''
        return decodeURIComponent(raw)
      },
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()
}

export function getSignalRConnection(): signalR.HubConnection {
  if (!connection) {
    connection = createConnection()
  }
  return connection
}

export async function startConnection(signal?: { cancelled: boolean }) {
  // Cancel any pending retry
  if (retryTimeout) {
    clearTimeout(retryTimeout)
    retryTimeout = null
  }

  // Stop existing connection
  if (connection) {
    try {
      await connection.stop()
    } catch {
      // ignore
    }
    connection = null
  }

  // If already cancelled (StrictMode unmount), bail out
  if (signal?.cancelled) return null

  const conn = getSignalRConnection()
  try {
    await conn.start()
    // Check cancellation after async operation
    if (signal?.cancelled) {
      await conn.stop()
      connection = null
      return null
    }
    console.log('SignalR Connected')
  } catch (err) {
    // Don't retry if cancelled
    if (signal?.cancelled) {
      connection = null
      return null
    }
    console.warn('SignalR connection failed, retrying in 5s...', err)
    connection = null
    retryTimeout = setTimeout(() => startConnection(signal), 5000)
    return null
  }
  return conn
}

export async function stopConnection() {
  // Cancel any pending retry
  if (retryTimeout) {
    clearTimeout(retryTimeout)
    retryTimeout = null
  }

  if (connection) {
    try {
      await connection.stop()
    } catch {
      // ignore
    }
    connection = null
  }
}
