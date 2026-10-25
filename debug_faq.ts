import { prisma } from './src/core/prisma'

async function main() {
  const questions = await prisma.faq_questions.findMany({
    where: { i_status: 1 },
    include: { steps: { include: { element: { include: { screen: true } } }, orderBy: { i_order: 'asc' } } },
  })
  for (const q of questions) {
    console.log('PREGUNTA:', q.id_faq_question, '-', q.vc_answer_text)
    for (const s of q.steps) {
      const e = s.element
      console.log('  PASO', s.i_order, '-> boton:', e.vc_label, '| x:', e.f_x, 'y:', e.f_y, '| w:', e.f_width, 'h:', e.f_height, '| direccion:', e.vc_direction, '| pantalla:', e.screen.vc_title)
    }
  }
  process.exit(0)
}

main()
