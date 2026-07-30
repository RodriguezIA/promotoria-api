# Evidencias del checklist (foto de acomodo + fotos de pregunta)

Diseño del guardado incremental de imágenes del checklist de tareas, para que el
promotor no pierda trabajo al salir de la app. Complementa
[STORAGE.md](./STORAGE.md) (estándar de assets) y aplica a `promotoria-api` y
`promotoria-app`.

## Problema que resuelve

1. **La foto de acomodo (página 0) nunca llegaba al servidor.** La app la envía
   en el campo multipart `arrangement_photo`, pero el controller solo procesaba
   campos `image_{id_rpq}`. Además el endpoint rechazaba `answers: []`, así que
   la página 0 sola no se podía guardar. Al reabrir el checklist siempre había
   que retomarla.
2. **Registro de assets de evidencias fuera del estándar.** Se subían con
   `entity_id = id_task`, por lo que cada foto nueva de *cualquier* pregunta
   desactivaba (`is_active = false`) el asset de la pregunta anterior de la
   misma tarea, y `resolveImages('task_answer', rpqIds)` buscaba por un id que
   nunca coincidía. La restauración funcionaba solo por el fallback
   `task_answers.vc_image_url`.
3. **Las evidencias restauradas no se veían en la app.** Los widgets de foto
   solo renderizaban archivo local, nunca la URL devuelta por el servidor.

## Contrato del endpoint `POST /tasks/:id_task/answers` (multipart/form-data)

| campo | tipo | notas |
| ----- | ---- | ----- |
| `answers` | string JSON | Arreglo `[{id_request_product_question, vc_answer}]`. Puede ser `[]` u omitirse **si** viene al menos un archivo. |
| `arrangement_photo` | file | Foto de acomodo de la tarea. Opcional. |
| `image_{id_rpq}` | file | Evidencia de la pregunta `id_rpq`. Opcional, uno por pregunta. |

Validación: 400 solo si `answers` es JSON inválido, o si no hay ni respuestas ni
archivos. Sigue siendo upsert idempotente por
`(id_task, id_promoter, id_request_product_question)` (índice `uq_task_answers`).

Respuesta: `data.answers` (filas upserteadas) y `data.arrangement_photo_url`
(si se subió foto de acomodo).

## Flujo interno (service)

1. Validar tarea y asignación del promotor (igual que antes).
2. **Transacción**: upsert de las filas de respuesta (solo `vc_answer`).
3. Fuera de la transacción (subidas a GCS son lentas), por cada evidencia:
   - Garantizar la fila `task_answers` (upsert sin tocar `vc_answer`).
   - `StorageService.uploadAsset({ entity: 'task_answer', entity_id: id_task_answer, extraRef: id_rpq })`.
   - Actualizar `task_answers.vc_image_url` con la URL nueva.
4. Foto de acomodo: `uploadAsset({ entity: 'task_arrangement', entity_id: id_task })`.
   El mecanismo no-destructivo de assets desactiva la versión anterior de la
   misma tarea: retomar la foto la reemplaza sin borrar nada del bucket.

## Estándar de assets (cambios vs STORAGE.md previo)

| entity_type | entity_id | extraRef | carpeta |
| ----------- | --------- | -------- | ------- |
| `task_answer` | **`id_task_answer`** (antes: `id_task`, incorrecto) | `id_rpq` | `task_answers/{id_task_answer}/...` |
| `task_arrangement` (nuevo) | `id_task` | — | `task_arrangements/{id_task}/...` |

Con `entity_id = id_task_answer` cada evidencia tiene su propio historial de
versiones y desactivar la anterior solo afecta a esa pregunta.

## Restauración: `GET /tasks/:id_task/checklist`

Devuelve, además del árbol de productos/preguntas:

- `myAnswers[]`: respuestas del promotor con `vc_answer` y `vc_image_url`.
  La URL de imagen se resuelve por asset activo (`entity_id = id_task_answer`)
  con fallback a `vc_image_url` de la fila (cubre assets legacy registrados con
  `entity_id = id_task`).
- `arrangement_photo_url`: asset activo `task_arrangement` de la tarea, o null.

## Lado app (promotoria-app)

- `_saveCurrentPageToServer` guarda la página 0 (foto de acomodo sola,
  `answers: []`) al pasar de página; ya no espera a la primera página de
  preguntas.
- Preguntas foto sin archivo local nuevo no se reenvían (el servidor ya las
  tiene; evita guardar la URL como `vc_answer`).
- Los widgets de foto (`_buildPhotoCapture` de la pantalla y `_buildPhoto` de
  `question_widgets.dart`) renderizan la imagen del servidor (`Image.network`)
  cuando no hay archivo local pero existe URL, con la opción "Cambiar" para
  retomarla.
- El mapper del checklist ya lee `arrangement_photo_url` y ya hidrata
  `serverAnswer` desde `myAnswers`; al reabrir, el checklist salta a la primera
  página incompleta con todo lo guardado visible.
