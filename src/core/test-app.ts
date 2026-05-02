import express from 'express';
import { clientRouter, productRouter, userAdminRouter, storeRouter, channelsSalesRouter, promoterRouter, questionRouter } from '../modules';

export const testApp = express();

testApp.use(express.json());
testApp.use(express.urlencoded({ extended: true }));

testApp.use('/retailink-api/users', userAdminRouter);
testApp.use('/retailink-api/products', productRouter);
testApp.use('/retailink-api/clients', clientRouter);
testApp.use('/retailink-api/stores', storeRouter);
testApp.use('/retailink-api/channel-sales', channelsSalesRouter);
testApp.use('/retailink-api/promoters', promoterRouter);
testApp.use('/retailink-api/questions', questionRouter);
