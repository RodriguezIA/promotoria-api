import { createQuestionSchema, updateQuestionSchema } from './questions.schema';

describe('Question Schemas', () => {
  const validQuestion = {
    id_user: 1,
    question: '¿Cómo está el producto?',
    question_type: 'open',
    options: [
      { option_text: 'Bien', option_order: 1 },
    ],
  };

  describe('createQuestionSchema', () => {
    it('should accept a valid question', () => {
      expect(() => createQuestionSchema.parse(validQuestion)).not.toThrow();
    });

    it('should reject invalid question_type', () => {
      const invalid = { ...validQuestion, question_type: 'inventado' };
      expect(() => createQuestionSchema.parse(invalid)).toThrow();
    });

    it('should reject empty question text', () => {
      const invalid = { ...validQuestion, question: '' };
      expect(() => createQuestionSchema.parse(invalid)).toThrow();
    });

    it('should accept without options', () => {
      const { options: _, ...minimal } = validQuestion;
      expect(() => createQuestionSchema.parse(minimal)).not.toThrow();
    });
  });

  describe('updateQuestionSchema', () => {
    it('should accept partial update', () => {
      expect(() => updateQuestionSchema.parse({ question: 'Nueva pregunta' })).not.toThrow();
    });
  });
});
