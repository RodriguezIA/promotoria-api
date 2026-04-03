import { Queue } from "bullmq";
import { connectionQueue } from "./conection";

export const process_task_notificacions_queue = new Queue("task_notifications", { connection: connectionQueue });
