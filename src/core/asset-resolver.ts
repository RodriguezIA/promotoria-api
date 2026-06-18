import { prisma } from './prisma';

/**
 * Consulta en batch los assets activos para una entidad y devuelve
 * un Map<entity_id, vc_url>. Usar con ?? para hacer fallback al campo legacy.
 */
export async function resolveImages(
  entityType: string,
  ids: number[]
): Promise<Map<number, string>> {
  if (!ids.length) return new Map();
  const assets = await prisma.assets.findMany({
    where: { entity_type: entityType, entity_id: { in: ids }, is_active: true },
    select: { entity_id: true, vc_url: true },
  });
  return new Map(assets.map(a => [a.entity_id, a.vc_url]));
}
