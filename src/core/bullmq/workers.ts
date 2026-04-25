import { Queue, Worker } from "bullmq";
import { connectionWorker } from "./conection";


console.log("🚀 Worker file loaded");
const process_task_notificacions_worker = new Worker("task_notifications", async job => {
    const { taskId } = job.data;

}, { connection: connectionWorker });


process_task_notificacions_worker.on('completed', job => {

});

process_task_notificacions_worker.on('failed', (job, err) => {

});

process_task_notificacions_worker.on('error', err => {

});

export default process_task_notificacions_worker;
