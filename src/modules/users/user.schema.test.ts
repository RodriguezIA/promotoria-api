import { createUserSchema } from './user.schema';

describe('User Schemas', () => {
  const validUser = {
    email: 'user@test.com',
    name: 'Juan',
    lastname: 'Pérez',
    password: '123456',
    id_client: 1,
  };

  describe('createUserSchema', () => {
    it('should accept a valid user', () => {
      expect(() => createUserSchema.parse(validUser)).not.toThrow();
    });

    it('should reject short password', () => {
      const invalid = { ...validUser, password: '123' };
      expect(() => createUserSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = { ...validUser, email: 'bad-email' };
      expect(() => createUserSchema.parse(invalid)).toThrow();
    });

    it('should reject missing id_client', () => {
      const { id_client: _, ...invalid } = validUser;
      expect(() => createUserSchema.parse(invalid)).toThrow();
    });
  });
});
