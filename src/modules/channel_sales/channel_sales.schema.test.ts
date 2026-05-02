import { createChannelSalesSchema, updateChannelSalesSchema } from './channel_sales.schema';

describe('Channel Sales Schemas', () => {
  const valid = {
    name: 'Canal Principal',
    description: 'Descripción del canal',
  };

  describe('createChannelSalesSchema', () => {
    it('should accept a valid channel', () => {
      expect(() => createChannelSalesSchema.parse(valid)).not.toThrow();
    });

    it('should reject missing name', () => {
      const invalid = { ...valid, name: '' };
      expect(() => createChannelSalesSchema.parse(invalid)).toThrow();
    });

    it('should reject missing description', () => {
      const invalid = { ...valid, description: '' };
      expect(() => createChannelSalesSchema.parse(invalid)).toThrow();
    });
  });

  describe('updateChannelSalesSchema', () => {
    it('should accept partial update', () => {
      expect(() => updateChannelSalesSchema.parse({ name: 'Otro nombre' })).not.toThrow();
    });
  });
});
