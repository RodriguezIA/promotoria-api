import io

path = "prisma/schema.prisma"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

cambios = 0

# 1. Agregar campo de genero a promoters
old1 = """  b_show_intro_videos Boolean @default(true)
  tasks                  tasks[]"""
new1 = """  b_show_intro_videos Boolean @default(true)
  /// Genero del promotor, elegido por el mismo desde su perfil en la app.
  /// Se usa para elegir el avatar del asistente de "Dudas?" (se le muestra
  /// una mujer si es hombre, un hombre si es mujer). Null hasta que lo capture.
  vc_gender String? @db.VarChar(1)
  tasks                  tasks[]"""

if "vc_gender" in content:
    print("YA ESTABA: promoters ya tiene vc_gender")
else:
    assert content.count(old1) == 1, "No encontre el bloque de promoters esperado"
    content = content.replace(old1, new1)
    cambios += 1
    print("OK: campo vc_gender agregado a promoters")

# 2. Agregar las 5 tablas nuevas al final del archivo
if "model faq_questions" in content:
    print("YA ESTABA: ya existen las tablas de faq")
else:
    nuevas_tablas = """

/// Pantalla de la app registrada por el master para poder senalar botones
/// sobre ella en las respuestas de "Dudas?". Cada pantalla tiene una foto
/// (screenshot) subida por el master y, sobre ella, los botones marcados
/// (ver faq_screen_elements).
model faq_screens {
  id_faq_screen             Int      @id @default(autoincrement()) @db.UnsignedInt
  vc_screen_key             String   @unique @db.VarChar(100)
  vc_title                  String   @db.VarChar(150)
  vc_screenshot_url         String   @db.VarChar(500)
  vc_screenshot_bucket_path String   @db.VarChar(500)
  dt_register               DateTime @default(now()) @db.Timestamp(0)
  dt_updated                DateTime @default(now()) @updatedAt @db.Timestamp(0)
  elements                  faq_screen_elements[]
}

/// Un boton/elemento marcado por el master sobre la foto de una pantalla
/// (faq_screens), con el rectangulo donde aparece (en porcentaje, para que
/// no dependa de la resolucion de pantalla). vc_element_key debe coincidir
/// con la llave real que tiene ese boton en el codigo de la app (Flutter),
/// para poder resaltarlo de verdad cuando se usa en un paso (ver
/// faq_highlight_steps).
model faq_screen_elements {
  id_faq_screen_element Int      @id @default(autoincrement()) @db.UnsignedInt
  id_faq_screen         Int      @db.UnsignedInt
  vc_element_key        String   @db.VarChar(100)
  vc_label              String   @db.VarChar(150)
  f_x                   Float
  f_y                   Float
  f_width               Float
  f_height              Float
  dt_register           DateTime @default(now()) @db.Timestamp(0)
  screen                faq_screens @relation(fields: [id_faq_screen], references: [id_faq_screen], onDelete: Cascade)
  steps                 faq_highlight_steps[]

  @@unique([id_faq_screen, vc_element_key], map: "uq_faq_screen_element_key")
}

/// Pregunta frecuente armada por el master: una respuesta con varias
/// formas distintas de preguntarla (faq_question_phrases) para que el
/// promotor la encuentre escriba como escriba, y opcionalmente una
/// secuencia de botones a resaltar (faq_highlight_steps).
model faq_questions {
  id_faq_question Int      @id @default(autoincrement()) @db.UnsignedInt
  vc_answer_text  String   @db.Text
  i_status        Int      @default(1) @db.TinyInt
  dt_register     DateTime @default(now()) @db.Timestamp(0)
  dt_updated      DateTime @default(now()) @updatedAt @db.Timestamp(0)
  phrases         faq_question_phrases[]
  steps           faq_highlight_steps[]
}

model faq_question_phrases {
  id_faq_question_phrase Int      @id @default(autoincrement()) @db.UnsignedInt
  id_faq_question        Int      @db.UnsignedInt
  vc_phrase              String   @db.VarChar(255)
  dt_register            DateTime @default(now()) @db.Timestamp(0)
  question               faq_questions @relation(fields: [id_faq_question], references: [id_faq_question], onDelete: Cascade)

  @@index([id_faq_question], map: "idx_faq_question_phrases_question")
}

model faq_highlight_steps {
  id_faq_highlight_step Int      @id @default(autoincrement()) @db.UnsignedInt
  id_faq_question       Int      @db.UnsignedInt
  id_faq_screen_element Int      @db.UnsignedInt
  i_order               Int      @default(0)
  question              faq_questions @relation(fields: [id_faq_question], references: [id_faq_question], onDelete: Cascade)
  element               faq_screen_elements @relation(fields: [id_faq_screen_element], references: [id_faq_screen_element])

  @@index([id_faq_question, i_order], map: "idx_faq_highlight_steps_question")
}
"""
    content = content.rstrip("\n") + "\n" + nuevas_tablas
    cambios += 1
    print("OK: tablas de faq agregadas al final del schema")

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"TOTAL cambios aplicados: {cambios}")
