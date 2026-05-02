import { createStoreSchema, updateStoreSchema, createAddressSchema } from './store.schema';

describe('Store Schemas', () => {
  const validAddress = {
    entity_type: 'store',
    entity_id: 1,
    id_country: 1,
    id_state: 1,
    id_city: 1,
    street: 'Calle Falsa',
    ext_number: '123',
    postal_code: '01000',
  };

  const validStore = {
    id_user: 1,
    name: 'Tienda Norte',
    address: validAddress,
  };

  describe('createStoreSchema', () => {
    it('should accept a valid store payload', () => {
      expect(() => createStoreSchema.parse(validStore)).not.toThrow();
    });

    it('should reject when name is missing', () => {
      const invalid = { ...validStore, name: '' };
      expect(() => createStoreSchema.parse(invalid)).toThrow();
    });

    it('should reject when id_user is not a positive integer', () => {
      const invalid = { ...validStore, id_user: 0 };
      expect(() => createStoreSchema.parse(invalid)).toThrow();
    });

    it('should reject when address is missing', () => {
      const { address: _, ...invalid } = validStore;
      expect(() => createStoreSchema.parse(invalid)).toThrow();
    });
  });

  describe('createAddressSchema', () => {
    it('should accept a valid address', () => {
      expect(() => createAddressSchema.parse(validAddress)).not.toThrow();
    });

    it('should reject when street is missing', () => {
      const invalid = { ...validAddress, street: '' };
      expect(() => createAddressSchema.parse(invalid)).toThrow();
    });
  });

  describe('updateStoreSchema', () => {
    it('should accept partial payload', () => {
      expect(() => updateStoreSchema.parse({ name: 'Solo nombre' })).not.toThrow();
    });

    it('should accept empty object', () => {
      expect(() => updateStoreSchema.parse({})).not.toThrow();
    });
  });
});
