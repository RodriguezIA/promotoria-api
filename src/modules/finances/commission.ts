export type CommissionType = 'PERCENTAGE' | 'FIXED'
export interface CommissionRule { type: CommissionType; value: number }

const r2 = (n: number) => Math.round(n * 100) / 100

export function promoterRule(s: any): CommissionRule {
    return {
        type: s?.vc_promoter_commission_type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        value: Number(s?.f_promoter_commission_percentage ?? 0),
    }
}

export function activatorRule(s: any): CommissionRule {
    return {
        type: s?.vc_activator_commission_type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        value: Number(s?.f_activator_commission_percentage ?? 0),
    }
}

/** Lo que gana el promotor por una tarea: monto fijo, o % del valor de la tarea. */
export function promoterAmount(baseValue: number, rule: CommissionRule): number {
    return rule.type === 'FIXED' ? r2(rule.value) : r2(baseValue * (rule.value / 100))
}

/**
 * Lo que gana el activador por una tarea: monto fijo, o % sobre lo que YA gana el promotor.
 */
export function activatorAmount(baseValue: number, promoter: CommissionRule, activator: CommissionRule): number {
    if (activator.type === 'FIXED') return r2(activator.value)
    const promoterEarning = promoter.type === 'FIXED' ? promoter.value : baseValue * (promoter.value / 100)
    return r2(promoterEarning * (activator.value / 100))
}
