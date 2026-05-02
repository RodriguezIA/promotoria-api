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
import { Product } from './product.service';

describe('Products Module Integration', () => {
  const validProduct = {
    id_user: 1,
    id_client: 2,
    name: 'Producto Test',
    description: 'Descripción de prueba',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('POST /retailink-api/products', () => {
    it('should create a product with valid data', async () => {
      jest.spyOn(Product.prototype, 'createProduct').mockResolvedValue({ id_product: 77, ...validProduct } as any);

      const res = await api
        .post('/retailink-api/products')
        .set(authHeader('fake-jwt-token'))
        .send(validProduct);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id_product', 77);
    });

    it('should return 400 when name is missing', async () => {
      const res = await api
        .post('/retailink-api/products')
        .set(authHeader('fake-jwt-token'))
        .send({ ...validProduct, name: '' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await api.post('/retailink-api/products').send(validProduct);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /retailink-api/products/:id_client', () => {
    it('should list products by client', async () => {
      jest.spyOn(Product.prototype, 'getProductsByClientId').mockResolvedValue([{ id_product: 1, name: 'Producto A' }] as any);

      const res = await api
        .get('/retailink-api/products/2')
        .set(authHeader('fake-jwt-token'));

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
