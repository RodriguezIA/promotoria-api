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
import { Client } from './client.service';

describe('Clients Module Integration', () => {
  const validClient = {
    id_user: 1,
    name: 'Cliente Test',
    email: 'cliente@test.com',
    phone: '5512345678',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('POST /retailink-api/clients', () => {
    it('should create a client with valid data', async () => {
      jest.spyOn(Client.prototype, 'createClient').mockResolvedValue({ id_client: 88, ...validClient } as any);

      const res = await api
        .post('/retailink-api/clients')
        .set(authHeader('fake-jwt-token'))
        .send(validClient);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id_client', 88);
    });

    it('should return 400 with invalid email', async () => {
      const res = await api
        .post('/retailink-api/clients')
        .set(authHeader('fake-jwt-token'))
        .send({ ...validClient, email: 'no-es-email' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await api.post('/retailink-api/clients').send(validClient);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /retailink-api/clients', () => {
    it('should list clients', async () => {
      jest.spyOn(Client.prototype, 'getClientsList').mockResolvedValue([{ id_client: 1, name: 'Cliente A' }] as any);

      const res = await api.get('/retailink-api/clients').set(authHeader('fake-jwt-token'));
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
