# Retailink — Mobile API Reference

Base URL: `/retailink-api/mobile`
Auth: ninguna (autenticación por `id_promoter` en body/query)

---

## Estatus de tareas

| id_status | Significado | Quién lo asigna |
|-----------|-------------|-----------------|
| 1 | Creado / Disponible | Sistema al crear la orden |
| 2 | Asignado | Promotor (accept) |
| 3 | En camino | Promotor (update-status) |
| 4 | En ejecución | Promotor (update-status) |
| 5 | Enviado a validación | Promotor (update-status) |
| 6 | Terminado | Admin/SaaS |
| 7 | Rechazado | Admin/SaaS |

---

## Endpoints

### Login promotor
`POST /retailink-api/admin/promoters/login`
```json
{ "vc_phone": "5512345678", "vc_password": "pass", "vc_fcm_token": "...", "f_latitude": 19.43, "f_longitude": -99.13 }
```
Respuesta: datos del promotor (sin password). **No devuelve JWT.**

---

### Actualizar ubicación
`POST /update-location`
```json
{ "id_promoter": 1, "f_latitude": 19.43, "f_longitude": -99.13 }
```
Llamar cada 5-10 min mientras la app esté activa.

---

### Lista de tareas del promotor
`GET /tasks?id_promoter=1&id_status=2`

- `id_promoter` (requerido)
- `id_status` (opcional) — filtra por estatus

Respuesta incluye: info básica de tarea, tienda (nombre, dirección, lat/lng), nombre del request.

---

### Detalle completo de tarea
`GET /tasks/:id_task`

Respuesta:
```json
{
  "ok": true,
  "data": {
    "id_task": 5,
    "id_status": 2,
    "store": {
      "name": "OXXO Centro",
      "street": "Av. Reforma",
      "ext_number": "123",
      "neighborhood": "Centro",
      "municipality": "CDMX",
      "state": "CDMX",
      "postal_code": "06600",
      "latitude": 19.4326,
      "longitude": -99.1332
    },
    "request": { "id_request": 3, "name": "Auditoría Mayo", "value": 500 },
    "products": [
      {
        "id_product": 2,
        "product_name": "Coca Cola 600ml",
        "f_subtotal": 100,
        "questions": [
          {
            "id_question": 1,
            "question": "¿Está disponible en anaquel?",
            "question_type": "yes_no",
            "promoter_earns": 50,
            "precio_aplicado": 50,
            "options": []
          },
          {
            "id_question": 2,
            "question": "¿Cuántas piezas hay?",
            "question_type": "numeric",
            "min_value": 0,
            "max_value": 100,
            "options": []
          },
          {
            "id_question": 3,
            "question": "Selecciona presentación",
            "question_type": "options",
            "options": [
              { "id_option": 1, "option_text": "600ml", "option_order": 1 },
              { "id_option": 2, "option_text": "1.5L",  "option_order": 2 }
            ]
          }
        ]
      }
    ]
  }
}
```

**Tipos de pregunta:** `open` | `yes_no` | `numeric` | `options` | `date` | `photo`

Para mostrar la ruta al establecimiento usar `store.latitude` y `store.longitude` con Google Maps.

---

### Aceptar tarea (notificación push recibida)
`POST /tasks/:id_task/accept`
```json
{ "id_promoter": 1 }
```
- Asigna el promotor a la tarea y cambia estatus a **2 (Asignado)**
- Falla con 409 si la tarea ya fue tomada por otro promotor

---

### Rechazar tarea (notificación push recibida)
`POST /tasks/:id_task/reject`
```json
{ "id_promoter": 1 }
```
- Registra el rechazo → el cron **no volverá a notificar** a este promotor para esta tarea

---

### Actualizar estatus de tarea
`PATCH /tasks/:id_task/status`
```json
{ "id_promoter": 1, "id_status": 3 }
```
El promotor solo puede asignar: **2, 3, 4, 5**

Flujo típico:
1. Acepta tarea → status 2 (automático con /accept)
2. Inicia ruta → `PATCH status 3`
3. Llega a la tienda → `PATCH status 4`
4. Termina y envía respuestas → `PATCH status 5`

---

## Notificaciones push (FCM)

El servidor envía push automáticamente cada 5 min a promotores cercanos con tareas disponibles.

**Data payload de la notificación:**
```json
{
  "id_task": "5",
  "radius_km": "3",
  "notification_count": "2"
}
```

En Flutter, al recibir la notificación mostrar pantalla de aceptar/rechazar con el `id_task`.
Al aceptar → llamar `POST /tasks/:id_task/accept`.
Al rechazar → llamar `POST /tasks/:id_task/reject`.

---

## SQL requerido (ejecutar en BD)

```sql
-- Lat/lng en promotores (si no se hizo antes)
ALTER TABLE promoters
  ADD COLUMN f_latitude  DECIMAL(10,8) NULL,
  ADD COLUMN f_longitude DECIMAL(11,8) NULL;

-- Contador de notificaciones en tareas (si no se hizo antes)
ALTER TABLE tasks
  ADD COLUMN i_notification_count INT NOT NULL DEFAULT 0;

-- Tabla de rechazos de tareas por promotor
CREATE TABLE task_rejections (
  id_rejection  INT AUTO_INCREMENT PRIMARY KEY,
  id_task       INT NOT NULL,
  id_promoter   INT NOT NULL,
  dt_register   DATETIME DEFAULT NOW(),
  UNIQUE KEY uq_task_promoter (id_task, id_promoter)
);
```
