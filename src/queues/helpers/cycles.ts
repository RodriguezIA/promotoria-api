export const NOTIFICATION_CYCLES = [
    { ciclo: 1, radioMetros: 10,    delayMs: 0           },
    { ciclo: 2, radioMetros: 50,    delayMs: 60_000      }, // 1 min después
    { ciclo: 3, radioMetros: 100,   delayMs: 60_000 * 2  },
    { ciclo: 4, radioMetros: 1000,  delayMs: 60_000 * 3  },
] as const;

export type CicloConfig = typeof NOTIFICATION_CYCLES[number];

export function getCicloConfig(ciclo: number): CicloConfig | null {
    return NOTIFICATION_CYCLES.find(c => c.ciclo === ciclo) ?? null;
}

// Intervalo entre push dentro de un ciclo
export const PUSH_INTERVAL_MS = 30_000; // 30s entre cada promotor