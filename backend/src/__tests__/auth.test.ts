import request from 'supertest';
import app from '../app';
import { User } from '../models/User';

// Mock mongoose database connection
jest.mock('mongoose', () => {
  const originalMongoose = jest.requireActual('mongoose');
  return {
    ...originalMongoose,
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      close: jest.fn().mockResolvedValue(true),
    },
  };
});

// Mock User model module structure
jest.mock('../models/User', () => {
  return {
    __esModule: true,
    User: {
      findOne: jest.fn(),
    },
    default: {
      findOne: jest.fn(),
    },
  };
});

describe('Auth Endpoints & Middleware Mocked', () => {
  beforeEach(() => {
    // Re-specify mock implementations inside beforeEach to prevent resetMocks from wiping them
    const mockSelect = jest.fn().mockResolvedValue(null);
    (User.findOne as jest.Mock).mockReturnValue({
      select: mockSelect,
    });
  });

  it('should return error for invalid login credentials (mocked database)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ userId: 'fakeuser', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
