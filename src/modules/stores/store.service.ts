import { prisma } from '../../core/prisma'
import { CreateStoreDTO } from './store.dto'

export class Store {

    async createStore(storePaylaod: CreateStoreDTO){
        return await prisma.$transaction( async() => {
            const store =  await prisma.stores.create({
                data: {
                    id_user: storePaylaod.id_user,
                    name: storePaylaod.name,
                    store_code: storePaylaod.store_code,
                }
            })

            await prisma.addresses.create({
                data: {
                    entity_type: 'store',
                    entity_id: store.id_store,
                    id_country: storePaylaod.address.id_country,
                    id_state: storePaylaod.address.id_state,
                    id_city: storePaylaod.address.id_city,
                    street: storePaylaod.address.street,
                    ext_number: storePaylaod.address.ext_number,
                    int_number: storePaylaod.address.int_number,
                    neighborhood: storePaylaod.address.neighborhood,
                    postal_code: storePaylaod.address.postal_code,
                    address_references: storePaylaod.address.address_references,
                    latitude: storePaylaod.address.latitude,
                    longitude: storePaylaod.address.longitude,
                }
            })

            await prisma.store_logs.create({
                data: {
                    id_store: store.id_store,
                    id_user: storePaylaod.id_user,
                    log: `Tienda creada ${store.name}`
                }
            })
            return store
        })
    }

    async getStore(id_store: number){
        return await prisma.$transaction( async() => {
            const store = await prisma.stores.findUnique({
                where: { id_store } 
            })

            const address = await prisma.addresses.findFirstOrThrow({
                where: { entity_type: 'store', entity_id: id_store, is_active: true }
            })

            const logs = await prisma.store_logs.findMany({
                where: { id_store }
            })


            return {...store, address, logs} 
        })
    }

    async getStores() {
        return await prisma.$transaction(async () => {
            const stores = await prisma.stores.findMany({
                where: { i_status: 1 }
            })

            const storesWithAddress = await Promise.all(
                stores.map(async (store) => {
                    const address = await prisma.addresses.findFirst({
                        where: { entity_type: 'store', entity_id: store.id_store, is_active: true },
                        include: {
                            country: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            },
                            state: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            },
                            city: {
                                select: {
                                    id: true,
                                    name: true,
                                }
                            }
                        }
                    })

                    return { ...store, address }
                })
            )

            return storesWithAddress
        })
    }

    async updateStore(id_store: number, storePaylaod: CreateStoreDTO){
        return await prisma.$transaction(async () => {
            const store = await prisma.stores.update({
                where: { id_store },
                data: {
                    name: storePaylaod.name,
                    store_code: storePaylaod.store_code,
                }
            })

            const address_db = await prisma.addresses.findFirstOrThrow({
                where: { entity_type: 'store', entity_id: id_store, is_active: true },
            })

            await prisma.addresses.update({
                where: { id: address_db.id },
                data: {
                    id_country: storePaylaod.address.id_country,
                    id_state: storePaylaod.address.id_state,
                    id_city: storePaylaod.address.id_city,
                    street: storePaylaod.address.street,
                    ext_number: storePaylaod.address.ext_number,
                    int_number: storePaylaod.address.int_number,
                    neighborhood: storePaylaod.address.neighborhood,
                    postal_code: storePaylaod.address.postal_code,
                    address_references: storePaylaod.address.address_references,
                    latitude: storePaylaod.address.latitude,
                    longitude: storePaylaod.address.longitude,
                }
            })

            await prisma.store_logs.create({
                data: {
                    id_store: store.id_store,
                    id_user: storePaylaod.id_user,
                    log: `Datos de tienda actualizada ${store.name}`
                }
            })
            return store
        })
    }


    async deleteStore(id_store: number){
        return await prisma.$transaction(async () => {
            await prisma.stores.update({
                where: { id_store },
                data: {
                    i_status: 0
                }
            })

            const address = await prisma.addresses.findFirstOrThrow({
                where: { entity_type: 'store', entity_id: id_store, is_active: true }
            })

            await prisma.addresses.update({
                where: { id: address.id },
                data: {
                    is_active: false
                }
            })

            await prisma.store_logs.create({
                data: {
                    id_store,
                    id_user: 1,
                    log: `Tienda eliminada`
                }
            })
        })
    }
}