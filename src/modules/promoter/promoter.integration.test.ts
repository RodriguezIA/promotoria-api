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

import { api } from '../../core/test-utils';
import { Promoter } from './promoter.service';
import { Utils } from '../../core/utils';

describe('Promoters Module Integration', () => {
  const validPromoter = {
    name: 'Promotor Test',
    password: '123456',
    phone: '5512345678',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('POST /retailink-api/promoters', () => {
    it('should create a promoter with valid data', async () => {
      jest.spyOn(Promoter.prototype, 'createPromoter').mockResolvedValue({ id: 44, ...validPromoter } as any);

      const res = await api.post('/retailink-api/promoters').send(validPromoter);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id', 44);
    });

    it('should return 400 with short password', async () => {
      const res = await api
        .post('/retailink-api/promoters')
        .send({ ...validPromoter, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('POST /retailink-api/promoters/login', () => {
    it('should login with valid credentials', async () => {
      jest.spyOn(Promoter.prototype, 'validatePromoterByTermino').mockResolvedValue({
        promoter: { id: 44, name: 'Promotor Test', phone: validPromoter.phone, password: validPromoter.password },
        field: 'phone',
      } as any);
      jest.spyOn(Promoter.prototype, 'updateLastLogin').mockResolvedValue({} as any);
      jest.spyOn(Utils, 'generate_token').mockReturnValue('fake-jwt-token');

      const res = await api.post('/retailink-api/promoters/login').send({
        termino: validPromoter.phone,
        password: validPromoter.password,
        fcm_token: 'token_test',
      });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should return 400 with missing fcm_token', async () => {
      const res = await api.post('/retailink-api/promoters/login').send({
        termino: validPromoter.phone,
        password: validPromoter.password,
      });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });
});
