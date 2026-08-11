import "dotenv/config"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import express, { Express } from "express"
import { startTaskNotificacitonScheduler, startEnRouteTimeoutScheduler, startReviewTimeoutScheduler, queues } from "./core/bullmq"
import { initializeBullBoard, serverAdapter } from "./queues/helpers/bullboard"

import adminRouter from "./app_admin/index"
import superadminRouter from "./app_superadmin/index"
import mobileRouter from "./app_mobile/index"
import { clientRouter, productRouter, userAdminRouter, storeRouter, channelsSalesRouter, promoterRouter, questionRouter, requestRouter, orderRouter, taskRouter, financesRouter, taskSettingsRouter, appConfigRouter } from './modules'
import promoterSelfPaymentsRouter from './modules/promoter-payments-self/promoter-self-payments.routes'
import { errorHandler } from "./core/middleware"
import { setupSwagger } from "./config/swagger"

export const app: Express = express()
const PORT = parseInt(process.env.PORT || "3000", 10)

app.use(cors())

// Documentación Swagger (antes de helmet para evitar bloqueos de CSP en la UI).
setupSwagger(app)

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))

// Bull Board UI
initializeBullBoard(queues)
app.use("/retailink-api/queues", serverAdapter.getRouter())
startTaskNotificacitonScheduler()
startEnRouteTimeoutScheduler()
startReviewTimeoutScheduler()

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
app.use("/retailink-api/finances", financesRouter)
app.use("/retailink-api/task-settings", taskSettingsRouter)
app.use("/retailink-api/app-config", appConfigRouter)
app.use("/retailink-api/payments", promoterSelfPaymentsRouter)

// Manejo global de errores (multer, no controlados): debe ir después de todas las rutas.
app.use(errorHandler)

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
