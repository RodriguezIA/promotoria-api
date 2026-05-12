import { Queue } from "bullmq";
import { connectionQueue } from "./conection";

export const orderNotificationsQueue = new Queue("order_notifications", {
    connection: connectionQueue,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
    }
});