import { Request, Response, NextFunction } from 'express';
import { validateBody } from './validate.middleware';
import { z } from 'zod';

describe('validateBody middleware', () => {
  const mockSchema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    req = { body: {} };
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = { status: statusMock } as unknown as Response;
    next = jest.fn();
  });

  it('should call next when body is valid', () => {
    req.body = { name: 'Juan', age: 25 };
    validateBody(mockSchema)(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should return 400 when body is invalid', () => {
    req.body = { name: '', age: -1 };
    validateBody(mockSchema)(req as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: 'Datos de entrada inválidos',
      })
    );
  });

  it('should return 400 when body has wrong type', () => {
    req.body = { name: 'Juan', age: 'veinticinco' };
    validateBody(mockSchema)(req as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
  });
});
