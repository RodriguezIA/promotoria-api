import { prisma } from '../../core/prisma'
import { salesChannelsDTOCreate } from './channel_sales.dto'

export class SalesChannel {
    public async create(newChannel: salesChannelsDTOCreate ){
        return await prisma.sales_channels.create({
            data:{...newChannel}
        })
    }
}