import { setupWorker } from "msw/browser"
import { authHandlers } from "./handlers/auth"
import { cartHandlers } from "./handlers/cart"
import { favoriteHandlers } from "./handlers/favorites"
import { nftHandlers } from "./handlers/nfts"
import { orderHandlers } from "./handlers/orders"
import { profileHandlers } from "./handlers/profile"
import { walletHandlers } from "./handlers/wallets"
import { registerSocketServer, startMarketDrift } from "./realtime/server"

const socketHandler = registerSocketServer()

export const worker = setupWorker(
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
  socketHandler,
)

export async function startMockWorker() {
  // The mock worker (and the WebSocket interceptor it applies) MUST finish
  // starting before `socket.io-client` is ever imported — see the comment in
  // `src/lib/realtime/client.ts` for why (it caches `window.WebSocket` at
  // module-evaluation time). Nothing in this module or its imports pulls in
  // socket.io-client; only `getSocket()` does, lazily, later.
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
    quiet: true,
  })
  startMarketDrift()
}
