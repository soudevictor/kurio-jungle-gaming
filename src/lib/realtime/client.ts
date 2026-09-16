import type { Socket } from "socket.io-client"

/**
 * Singleton Socket.IO client, loaded lazily via dynamic `import()`.
 *
 * This is not just code-splitting: `engine.io-client` (a `socket.io-client`
 * dependency) reads `globalThis.WebSocket` into a **module-level constant**
 * the moment it's evaluated (see its `websocket.js` transport). A static
 * top-level `import "socket.io-client"` would run before the mock worker
 * patches `window.WebSocket`, permanently locking the transport onto the
 * real constructor and sending every "mocked" connection to the real
 * network. Deferring the import until after `startMockWorker()` has
 * resolved (see `src/mocks/browser.ts` / `main.tsx`) is what lets the
 * WebSocket interceptor actually intercept it.
 */
let socketPromise: Promise<Socket> | null = null

async function createSocket(): Promise<Socket> {
  const { io } = await import("socket.io-client")
  return io(window.location.origin, {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  })
}

export function getSocket(): Promise<Socket> {
  if (!socketPromise) socketPromise = createSocket()
  return socketPromise
}

export async function connectRealtime() {
  const socket = await getSocket()
  if (!socket.connected) socket.connect()
  return socket
}

export async function disconnectRealtime() {
  const socket = await getSocket()
  socket.disconnect()
}
