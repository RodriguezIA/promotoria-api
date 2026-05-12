import "dotenv/config"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import express, { Express } from "express"
import { orderNotificationsQueue } from "./core/bullmq"
import { initializeBullBoard } from "./queues/helpers/bullboard"

import adminRouter from "./app_admin/index"
import superadminRouter from "./app_superadmin/index"
import mobileRouter from "./app_mobile/index"
import { clientRouter, productRouter, userAdminRouter, storeRouter, channelsSalesRouter, promoterRouter, questionRouter, requestRouter, orderRouter, taskRouter } from './modules'

export const app: Express = express()
const PORT = parseInt(process.env.PORT || "3000", 10)

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

// Bull Board UI
initializeBullBoard([orderNotificationsQueue])
app.use("/retailink-api/queues", (req, res, next) => {
  // Import serverAdapter dynamically to avoid circular dependency issues
  const { serverAdapter } = require('./queues/helpers/bullboard')
  serverAdapter.getRouter()(req, res, next)
})

app.use("/retailink-api/superadmin", superadminRouter)
app.use("/retailink-api/admin", adminRouter)
app.use("/retailink-api/mobile", mobileRouter)

app.use("/retailink-api/users", userAdminRouter)
app.use("/retailink-api/products", productRouter)
app.use("/retailink-api/clients", clientRouter)
app.use("/retailink-api/stores", storeRouter)
app.use("/retailink-api/channel-sales", channelsSalesRouter)
app.use("/retailink-api/promoters", promoterRouter)
app.use("/retailink-api/questions", questionRouter)
app.use("/retailink-api/requests", requestRouter)
app.use("/retailink-api/orders", orderRouter)
app.use("/retailink-api/tasks", taskRouter)

if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    try {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`)
      })
    } catch (error) {
      console.error("Error starting server:", error)
    }
  }
  startServer()
}
