import { Queue, Worker } from "bullmq";
import { connectionWorker } from "./conection";


console.log("🚀 Worker file loaded");
const process_task_notificacions_worker = new Worker("task_notifications", async job => {
    const { taskId } = job.data;
    console.log(`Processing task notification for task ${taskId}`);
}, { connection: connectionWorker });

// 👇 Agrega estos para ver qué está pasando
process_task_notificacions_worker.on('completed', job => {
    console.log(`✅ Job ${job.id} completado`);
});

process_task_notificacions_worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} falló:`, err.message);
});

process_task_notificacions_worker.on('error', err => {
    console.error(`❌ Worker error:`, err.message);
});

export default process_task_notificacions_worker;
