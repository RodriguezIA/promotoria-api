import { createPromoterSchema, loginPromoterSchema, updateLocationPromoterSchema } from './promoter.schema';

describe('Promoter Schemas', () => {
  describe('createPromoterSchema', () => {
    const valid = {
      name: 'Promotor 1',
      password: '123456',
      phone: '5512345678',
    };

    it('should accept a valid promoter', () => {
      expect(() => createPromoterSchema.parse(valid)).not.toThrow();
    });

    it('should reject short password', () => {
      const invalid = { ...valid, password: '123' };
      expect(() => createPromoterSchema.parse(invalid)).toThrow();
    });

    it('should reject missing phone', () => {
      const { phone: _, ...invalid } = valid;
      expect(() => createPromoterSchema.parse(invalid)).toThrow();
    });
  });

  describe('loginPromoterSchema', () => {
    const valid = {
      termino: '5512345678',
      password: '123456',
      fcm_token: 'token_fcm_123',
    };

    it('should accept valid login payload', () => {
      expect(() => loginPromoterSchema.parse(valid)).not.toThrow();
    });

    it('should reject missing fcm_token', () => {
      const { fcm_token: _, ...invalid } = valid;
      expect(() => loginPromoterSchema.parse(invalid)).toThrow();
    });
  });

  describe('updateLocationPromoterSchema', () => {
    it('should accept valid coordinates', () => {
      expect(() => updateLocationPromoterSchema.parse({ id: 1, latitude: 19.4, longitude: -99.1 })).not.toThrow();
    });

    it('should reject missing id', () => {
      expect(() => updateLocationPromoterSchema.parse({ latitude: 19.4, longitude: -99.1 })).toThrow();
    });
  });
});
