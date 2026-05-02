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
import { Store } from './store.service';

describe('Stores Module Integration', () => {
  const validStore = {
    id_user: 1,
    name: 'Tienda Test',
    store_code: 'TT001',
    address: {
      entity_type: 'store',
      entity_id: 1,
      id_country: 1,
      id_state: 1,
      id_city: 1,
      street: 'Calle Test',
      ext_number: '123',
      postal_code: '01000',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('POST /retailink-api/stores', () => {
    it('should create a store with valid data', async () => {
      jest.spyOn(Store.prototype, 'createStore').mockResolvedValue({ id_store: 99, ...validStore } as any);

      const res = await api
        .post('/retailink-api/stores')
        .set(authHeader('fake-jwt-token'))
        .send(validStore);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id_store', 99);
    });

    it('should return 400 with invalid data', async () => {
      const res = await api
        .post('/retailink-api/stores')
        .set(authHeader('fake-jwt-token'))
        .send({ ...validStore, name: '' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await api.post('/retailink-api/stores').send(validStore);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /retailink-api/stores', () => {
    it('should list stores', async () => {
      jest.spyOn(Store.prototype, 'getStores').mockResolvedValue([{ id_store: 1, name: 'Tienda A' }] as any);

      const res = await api.get('/retailink-api/stores').set(authHeader('fake-jwt-token'));
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
