import { createClientSchema } from './client.schema';

describe('Client Schemas', () => {
  const validClient = {
    id_user: 1,
    name: 'Cliente Ejemplo',
    email: 'cliente@test.com',
    phone: '5512345678',
  };

  describe('createClientSchema', () => {
    it('should accept a valid client', () => {
      expect(() => createClientSchema.parse(validClient)).not.toThrow();
    });

    it('should reject when name is empty', () => {
      const invalid = { ...validClient, name: '' };
      expect(() => createClientSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = { ...validClient, email: 'no-es-email' };
      expect(() => createClientSchema.parse(invalid)).toThrow();
    });

    it('should accept empty email string (optional)', () => {
      const validEmptyEmail = { ...validClient, email: '' };
      expect(() => createClientSchema.parse(validEmptyEmail)).not.toThrow();
    });
  });
});
