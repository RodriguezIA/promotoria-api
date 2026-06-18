import { prisma } from '../../core/prisma'
import { salesChannelsDTOCreate } from './channel_sales.dto'
import { resolveImages } from '../../core/asset-resolver'

export class SalesChannel {
    public async create(newChannel: salesChannelsDTOCreate ){
        return await prisma.sales_channels.create({
            data:{...newChannel}
        })
    }

    public async getList(){
        const channels = await prisma.sales_channels.findMany({ where: { is_active: true } });
        const assetMap = await resolveImages('sale_channel', channels.map(c => c.id));
        return channels.map(c => ({ ...c, url_image: assetMap.get(c.id) ?? c.url_image }));
    }

    public async getById(id: number){
        const channel = await prisma.sales_channels.findFirst({
            where: { id, is_active: true },
            include: { stores: {} }
        });
        if (!channel) return null;
        const assetMap = await resolveImages('sale_channel', [id]);
        return { ...channel, url_image: assetMap.get(id) ?? channel.url_image };
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