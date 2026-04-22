import { prisma } from '../../core/prisma'
import { salesChannelsDTOCreate } from './channel_sales.dto'

export class SalesChannel {
    public async create(newChannel: salesChannelsDTOCreate ){
        return await prisma.sales_channels.create({
            data:{...newChannel}
        })
    }

    public async getList(){
        return await prisma.sales_channels.findMany({
            where: { is_active: true }
        })
    }

    public async getById(id: number){
        return await prisma.sales_channels.findFirst({
            where: { id, is_active: true },
            include: {
                stores: {}
            }
        })
    }

    public async update(id: number, channel: salesChannelsDTOCreate){
        return await prisma.sales_channels.update({
            where: {id},
            data: {
                name: channel.name,
                description: channel.description,
                url_image: channel.url_image
            }
        })
    }

    public async updateImage(id: number, url_image: string){
        return await prisma.sales_channels.update({
            where: {id},
            data: {
                url_image
            }
        })
    }

    public async delete(id: number){
        return await prisma.sales_channels.update({
            where: { id },
            data: {
                is_active: false
            }
        })
    }
}