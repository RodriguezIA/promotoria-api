import { createProductSchema, updateProductSchema } from './product.schema';

describe('Product Schemas', () => {
  const validProduct = {
    id_user: 1,
    id_client: 2,
    name: 'Producto A',
    description: 'Descripción opcional',
  };

  describe('createProductSchema', () => {
    it('should accept a valid product', () => {
      expect(() => createProductSchema.parse(validProduct)).not.toThrow();
    });

    it('should reject when name is missing', () => {
      const invalid = { ...validProduct, name: '' };
      expect(() => createProductSchema.parse(invalid)).toThrow();
    });

    it('should reject when id_client is missing', () => {
      const { id_client: _, ...invalid } = validProduct;
      expect(() => createProductSchema.parse(invalid)).toThrow();
    });
  });

  describe('updateProductSchema', () => {
    it('should accept partial update', () => {
      expect(() => updateProductSchema.parse({ name: 'Nuevo nombre' })).not.toThrow();
    });
  });
});
