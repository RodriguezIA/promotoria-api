import { prisma } from "@/core/prisma";

import { createClientData } from "./client.dto";

export class Client {

    async createClient(clientData: createClientData){
        try{
            return await prisma.$transaction(async (prisma) => {

                const client = await prisma.clients.create({
                    data: {
                        id_user: clientData.id_user,
                        name: clientData.name,
                        vc_initialism: clientData.name.substring(0, 3).toUpperCase(),
                        i_status: 1,
                        rfc: clientData.rfc,
                        email: clientData.email,
                        phone: clientData.phone,
                        adiccional_notes: clientData.addiccional_notes,
                    }
                });

                await prisma.addresses.create({
                    data: {
                        entity_type: "client",
                        entity_id: client.id_client,
                        id_country: clientData?.id_pais || 0,
                        id_state: clientData?.id_estado || 0,
                        id_city: clientData?.id_ciudad || 0,
                        street: clientData.street || "",
                        ext_number: clientData.ext_number || "",
                        int_number: clientData.int_number || "",
                        neighborhood: clientData.neighborhood || "",
                        postal_code: clientData.zip || "",
                        is_active: true,
                    }
                });

                await prisma.user_logs.create({
                    data: {
                        log: `Cliente creado: ${client.name}`,
                        id_user: clientData.id_user
                    }
                });

                return client;
            });
        } catch (error) {
            console.error("Error creating client:", error);
            throw error;
        }
    }

    async getClient(id_client: number){
        try {
            return await prisma.clients.findUnique({
                where: {
                    id_client: id_client
                },
            });
        } catch (error) {
            console.error("Error fetching client:", error);
            throw error;
        }
    }


    async updateSituacionFiscal(id_client: number, url: string) {
        return await prisma.clients.update({
            where: { id_client },
            data: { vc_url_situacion_fiscal: url }
        });
    }


    async getAddressByIdClient(id_client: number){
        return await prisma.addresses.findFirst({
            include: {
                country: {
                    select: {
                        id: true,
                        name: true
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
            },
            where: { 
                entity_type:"client",
                entity_id: id_client,
                is_active: true,
            },
        })
    }

}