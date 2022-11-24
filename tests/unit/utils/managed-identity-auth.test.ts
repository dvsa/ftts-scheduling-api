import { ManagedIdentityAuth, MangedIdentityAuthConfig } from '../../../src/utils/managed-identity-auth';

jest.mock('@dvsa/ftts-auth-client');

describe('ManagedIdentityAuth', () => {
  let managedIdentityAuth: ManagedIdentityAuth;

  const mockTokenCredential = {
    getToken: jest.fn(),
  };

  beforeEach(() => {
    managedIdentityAuth = new ManagedIdentityAuth({} as MangedIdentityAuthConfig, mockTokenCredential);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('gets the auth header', async () => {
    mockTokenCredential.getToken.mockImplementationOnce(() => ({ token: Promise.resolve('mockTestToken') }));

    const authHeader = await managedIdentityAuth.getAuthHeader();

    expect(authHeader).toStrictEqual({
      headers: {
        Authorization: 'Bearer mockTestToken',
      },
    });
    expect(mockTokenCredential.getToken).toHaveBeenCalled();
  });

  test('throws an error unable to get token', async () => {
    mockTokenCredential.getToken.mockRejectedValue(new Error('Unknown Error'));

    await expect(managedIdentityAuth.getAuthHeader()).rejects.toThrow('Unknown Error');
  });

  test('throws an error if token returned is undefined', async () => {
    mockTokenCredential.getToken.mockResolvedValue({ token: undefined });
    await expect(managedIdentityAuth.getAuthHeader()).rejects.toThrow('ManagedIdentityAuth::getToken: Auth call was successful but a invalid token object was returned');
  });

  test('throws an error if token returned is null', async () => {
    mockTokenCredential.getToken.mockResolvedValue({ token: null });
    await expect(managedIdentityAuth.getAuthHeader()).rejects.toThrow('ManagedIdentityAuth::getToken: Auth call was successful but a invalid token object was returned');
  });

  test('throws an error if token returned is an empty string', async () => {
    mockTokenCredential.getToken.mockResolvedValue({ token: '' });
    await expect(managedIdentityAuth.getAuthHeader()).rejects.toThrow('ManagedIdentityAuth::getToken: Auth call was successful but a invalid token object was returned');
  });

  test('get instance', () => {
    expect(ManagedIdentityAuth.getInstance()).toBeDefined();
  });
});
