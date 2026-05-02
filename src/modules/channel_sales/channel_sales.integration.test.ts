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
import { SalesChannel } from './channel_sales.service';

describe('Channel Sales Module Integration', () => {
  const validChannel = {
    name: 'Canal Test',
    description: 'Descripción del canal de prueba',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('POST /retailink-api/channel-sales', () => {
    it('should create a channel with valid data', async () => {
      jest.spyOn(SalesChannel.prototype, 'create').mockResolvedValue({ id: 33, ...validChannel } as any);

      const res = await api
        .post('/retailink-api/channel-sales')
        .send({ data: JSON.stringify(validChannel) });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id', 33);
    });

    it('should return 400 with missing name', async () => {
      const res = await api
        .post('/retailink-api/channel-sales')
        .send({ data: JSON.stringify({ ...validChannel, name: '' }) });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  describe('GET /retailink-api/channel-sales', () => {
    it('should list channels', async () => {
      jest.spyOn(SalesChannel.prototype, 'getList').mockResolvedValue([{ id: 1, name: 'Canal A' }] as any);

      const res = await api.get('/retailink-api/channel-sales');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
