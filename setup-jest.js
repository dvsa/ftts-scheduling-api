// This file will be run by jest whenever a new test file is loaded.

// Setup env vars
process.env.NODE_ENV = 'test';
process.env.APPINSIGHTS_INSTRUMENTATIONKEY = 'test';

// Setup Global Mocks
jest.mock('@dvsa/azure-logger');
jest.mock('redis', () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  createClient: () => ({
    on: jest.fn(),
    get: jest.fn(),
    keys: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  }),
}));
