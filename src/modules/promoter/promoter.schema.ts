import { z } from 'zod';

export const createPromoterSchema = z.object({
  name: z.string().min(1, 'name es requerido'),
  lastname: z.string().optional(),
  email: z.string().email('email debe ser válido').optional().or(z.literal('')),
  password: z.string().min(6, 'password debe tener al menos 6 caracteres'),
  phone: z.string().min(1, 'phone es requerido'),
  fcm_token: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const loginPromoterSchema = z.object({
  termino: z.string().min(1, 'termino es requerido'),
  password: z.string().min(1, 'password es requerido'),
  fcm_token: z.string().min(1, 'fcm_token es requerido'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateLocationPromoterSchema = z.object({
  id: z.number().int().positive('id es requerido'),
  latitude: z.number(),
  longitude: z.number(),
});

export const accountTypeEnum = z.enum(['CLABE', 'CARD']);

const bankAccountRefinement = (data: any, ctx: z.RefinementCtx) => {
  if (data.account_type === 'CLABE' && !data.clabe) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['clabe'],
      message: 'clabe es requerido cuando account_type es CLABE' });
  }
  if (data.account_type === 'CARD' && !data.card_number) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['card_number'],
      message: 'card_number es requerido cuando account_type es CARD' });
  }
};

const bankAccountBase = z.object({
  account_holder_name: z.string().min(1, 'account_holder_name es requerido'),
  account_type: accountTypeEnum,
  clabe: z.string().regex(/^\d{18}$/, 'clabe debe tener 18 dígitos').optional(),
  card_number: z.string().regex(/^\d{15,19}$/, 'card_number inválido').optional(),
  bank_name: z.string().min(1, 'bank_name es requerido'),
});

export const createPromoterBankAccountSchema = bankAccountBase.superRefine(bankAccountRefinement);

export const updatePromoterBankAccountSchema = bankAccountBase.partial().superRefine(bankAccountRefinement);

export const promoterIdParamSchema = z.object({
  id_promoter: z.string().regex(/^\d+$/, 'id_promoter debe ser un número'),
});

export const bankAccountIdParamSchema = z.object({
  id_promoter: z.string().regex(/^\d+$/, 'id_promoter debe ser un número'),
  id_account: z.string().regex(/^\d+$/, 'id_account debe ser un número'),
});
