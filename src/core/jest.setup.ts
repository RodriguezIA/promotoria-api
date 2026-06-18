jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }));
});

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    add: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
  RedisConnection: jest.fn(),
}));

jest.mock('../services/upload.service', () => ({
  UploadService: {
    uploadProductImage: jest.fn().mockResolvedValue('https://fake-url.com/image.png'),
    uploadClientDoc: jest.fn().mockResolvedValue('https://fake-url.com/doc.pdf'),
    uploadSaleChannelImage: jest.fn().mockResolvedValue('https://fake-url.com/channel.png'),
  },
}));

jest.mock('../services/storage.service', () => ({
  StorageService: {
    uploadAsset: jest.fn().mockResolvedValue({
      url: 'https://fake-url.com/asset.webp',
      path: 'fake/path/asset.webp',
      id_asset: 1,
    }),
  },
}));
