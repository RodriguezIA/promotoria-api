import request from 'supertest';
import { testApp } from './test-app';

export const api = request(testApp);

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
