jest.mock('../../core/utils', () => ({
  Utils: {
    generate_token: jest.fn(() => 'fake-jwt-token'),
    verify_token: jest.fn(() => Promise.resolve({ id: 1, email: 'test@test.com', id_client: 0, i_rol: 1 })),
    hash_password: jest.fn(),
    compare_password: jest.fn(),
    getCountriesList: jest.fn().mockResolvedValue([]),
    getStatesList: jest.fn().mockResolvedValue([]),
    getCitiesList: jest.fn().mockResolvedValue([]),
  }
}));

import { api, authHeader } from '../../core/test-utils';
import { Questions } from './questions.service';

describe('Questions Module Integration', () => {
  const validQuestion = {
    id_user: 1,
    question: '¿Pregunta de prueba?',
    question_type: 'open',
    options: [{ option_text: 'Opción 1', option_order: 1 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('POST /retailink-api/questions', () => {
    it('should create a question with valid data', async () => {
      jest.spyOn(Questions.prototype, 'createQuestion').mockResolvedValue({ id_question: 66, ...validQuestion } as any);

      const res = await api
        .post('/retailink-api/questions')
        .set(authHeader('fake-jwt-token'))
        .send(validQuestion);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id_question', 66);
    });

    it('should return 400 with invalid question_type', async () => {
      const res = await api
        .post('/retailink-api/questions')
        .set(authHeader('fake-jwt-token'))
        .send({ ...validQuestion, question_type: 'invalido' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await api.post('/retailink-api/questions').send(validQuestion);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /retailink-api/questions/:id_question', () => {
    it('should get question by id', async () => {
      jest.spyOn(Questions.prototype, 'getQuestionById').mockResolvedValue({ id_question: 66, question: '¿Pregunta de prueba?' } as any);

      const res = await api
        .get('/retailink-api/questions/66')
        .set(authHeader('fake-jwt-token'));

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id_question', 66);
    });
  });
});
