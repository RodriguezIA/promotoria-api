import { Prisma } from '../generated/prisma/client';

export const FOLIO_ENTITIES = {
    products: 'PRD',
    requests: 'SOL',
    orders: 'PED',
    tasks: 'TAR',
} as const;

export type FolioEntity = keyof typeof FOLIO_ENTITIES;

/**
 * Genera un folio único por cliente y entidad con formato
 * <INICIALES_CLIENTE>-<CODIGO_ENTIDAD>-<CONSECUTIVO 6 dígitos>, ej. ACME-PRD-000001.
 * Debe llamarse dentro de una transacción para que el consecutivo
 * no se desperdicie si la creación de la entidad falla.
 */
export async function generateFolio(
    tx: Prisma.TransactionClient,
    id_client: number,
    entity: FolioEntity
): Promise<string> {
    const counter = await tx.folios.upsert({
        where: { id_client_vc_entity: { id_client, vc_entity: entity } },
        create: { id_client, vc_entity: entity, i_current_folio: 1 },
        update: { i_current_folio: { increment: 1 } },
    });

    const client = await tx.clients.findUniqueOrThrow({
        where: { id_client },
        select: { vc_initialism: true },
    });

    const consecutive = String(counter.i_current_folio).padStart(6, '0');
    return `${client.vc_initialism}-${FOLIO_ENTITIES[entity]}-${consecutive}`;
}
