import { z } from 'zod';

const questionTypeEnum = z.enum(['open', 'boolean', 'numeric', 'range', 'evidence', 'multiple']);

export const createQuestionOptionSchema = z.object({
  option_text: z.string().min(1, 'option_text es requerido'),
  option_value_numeric: z.number().optional(),
  option_value_text: z.string().optional(),
  option_order: z.number().int().optional(),
});

export const createQuestionSchema = z.object({
  id_user: z.number().int().positive('id_user es requerido'),
  question: z.string().min(1, 'question es requerido'),
  question_type: questionTypeEnum,
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  max_photos: z.number().int().optional(),
  options: z.array(createQuestionOptionSchema).optional(),
  clients: z.array(z.number().int().positive()).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const assignClientsSchema = z.object({
  id_user: z.number().int().positive('id_user es requerido'),
  clients: z.array(z.number().int().positive()).min(1, 'Debe enviar al menos un cliente'),
});

export const questionIdParamSchema = z.object({
  id_question: z.string().regex(/^\d+$/, 'id_question debe ser un número').transform(Number),
});
