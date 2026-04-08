import "dotenv/config";
import express, { Express } from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import adminRouter from "./app_admin/index";
import superadminRouter from "./app_superadmin/index";
import mobileRouter from "./app_mobile/index"; 
import userAdminRouter from './modules/users/routes';
import productRouter from './modules/products/routes';
import clientRouter from './modules/clients/routes';
import { startNearbyTaskNotificationJob } from "./jobs/nearby-task-notification.job";
import "./core/bullmq/workers";
import { process_task_notificacions_queue } from "./core/bullmq/queue";
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
    queues: [
        new BullMQAdapter(process_task_notificacions_queue),
    ],
    serverAdapter,
});
const app: Express = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/retailink-api/superadmin", superadminRouter);
app.use("/retailink-api/admin", adminRouter);
app.use("/retailink-api/mobile", mobileRouter);
app.use("/retailink-api/users", userAdminRouter);
app.use("/retailink-api/products", productRouter);
app.use("/retailink-api/clients", clientRouter);
app.use("/admin/queues", serverAdapter.getRouter());
const startServer = async () => {
  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API is accessible at http://localhost:${PORT}`);
      console.log(`Local network access: http://[TU_IP_LOCAL]:${PORT}`);
    });
    startNearbyTaskNotificationJob();
  } catch (error) {
    console.error("Error starting server:", error);
  }
};
startServer();
