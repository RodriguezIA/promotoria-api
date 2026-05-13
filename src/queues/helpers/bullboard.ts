import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";

export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/retailink-api/queues");

let addQueue: ReturnType<typeof createBullBoard>['addQueue'];

export function initializeBullBoard(queues: Queue[]) {
  const { addQueue: aq } = createBullBoard({
    queues: queues.map(queue => new BullMQAdapter(queue)),
    serverAdapter,
  });
  addQueue = aq;
}