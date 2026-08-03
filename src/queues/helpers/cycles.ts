export const NOTIFICATION_CYCLES = [
    { ciclo: 1, radioMetros: 100,    delayMs: 0           },
    { ciclo: 2, radioMetros: 500,    delayMs: 60_000      }, // 1 min después
    { ciclo: 3, radioMetros: 2000,   delayMs: 60_000 * 2  },
    { ciclo: 4, radioMetros: 10000,  delayMs: 60_000 * 3  },
] as const;

export type CicloConfig = typeof NOTIFICATION_CYCLES[number];

export function getCicloConfig(ciclo: number): CicloConfig {
    const direct = NOTIFICATION_CYCLES.find(c => c.ciclo === ciclo);
    if (direct) return direct;

    // Ciclo fuera de la tabla (> 4): se queda en la config del último ciclo.
    const last = NOTIFICATION_CYCLES[NOTIFICATION_CYCLES.length - 1];
    return { ...last, ciclo } as CicloConfig;
}

// Intervalo entre push dentro de un ciclo
export const PUSH_INTERVAL_MS = 30_000; // 30s entre cada promotor