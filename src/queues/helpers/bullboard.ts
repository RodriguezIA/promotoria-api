import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/retailink-api/queues");

let addQueue: ReturnType<typeof createBullBoard>['addQueue'];
let removeQueue: ReturnType<typeof createBullBoard>['removeQueue'];

export function initializeBullBoard(queues: Queue[]) {
  const { addQueue: aq, removeQueue: rq } = createBullBoard({
    queues: queues.map(queue => new BullMQAdapter(queue)),
    serverAdapter,
  });
  addQueue = aq;
  removeQueue = rq;
}

export function registerDynamicQueue(queue: Queue) {
  if (!addQueue) {
    throw new Error("BullBoard not initialized. Call initializeBullBoard first.");
  }
  addQueue(new BullMQAdapter(queue));
}