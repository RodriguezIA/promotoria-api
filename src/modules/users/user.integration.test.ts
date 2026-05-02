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

jest.mock('../logs/logs.dto', () => ({
  LogsDTO: jest.fn().mockImplementation(() => ({
    createUserLog: jest.fn().mockResolvedValue({}),
  }))
}));

import { api, authHeader } from '../../core/test-utils';
import { UserAdminDTO } from './user.service';

describe('Users Module Integration', () => {
  const validUser = {
    email: 'nuevo@test.com',
    name: 'Nuevo',
    lastname: 'Usuario',
    password: '123456',
    id_client: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('POST /retailink-api/users', () => {
    it('should create a user with valid data', async () => {
      jest.spyOn(UserAdminDTO.prototype, 'getUserByEmailByClientId').mockResolvedValue(null as any);
      jest.spyOn(UserAdminDTO.prototype, 'createUser').mockResolvedValue({ id_user: 55, ...validUser } as any);

      const res = await api
        .post('/retailink-api/users')
        .set(authHeader('fake-jwt-token'))
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('id_user', 55);
    });

    it('should return 400 with short password', async () => {
      const res = await api
        .post('/retailink-api/users')
        .set(authHeader('fake-jwt-token'))
        .send({ ...validUser, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await api.post('/retailink-api/users').send(validUser);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /retailink-api/users/:id_client', () => {
    it('should list users by client', async () => {
      jest.spyOn(UserAdminDTO.prototype, 'getAllUsersByClientId').mockResolvedValue([{ id_user: 1, name: 'Usuario A' }] as any);

      const res = await api
        .get('/retailink-api/users/1')
        .set(authHeader('fake-jwt-token'));

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
