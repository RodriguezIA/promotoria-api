export const ROLES = {
  SUPER: 1,
  ADMIN: 2,
} as const

export const ORDER_STATUS = {
  CANCELADO: 0,
  CREADO: 1,
  CERRADO: 2,
} as const

// Documentado en API_DOCS.md. TERMINADO (6) hoy no lo pone ningún endpoint —
// el flujo de validación/cierre de tarea por el cliente aún no está implementado.
export const TASK_STATUS = {
  CANCELADO: 0,
  CREADO: 1,
  ASIGNADO: 2,
  EN_CAMINO: 3,
  EN_EJECUCION: 4,
  ENVIADO_VALIDACION: 5,
  TERMINADO: 6,
  RECHAZADO: 7,
} as const
