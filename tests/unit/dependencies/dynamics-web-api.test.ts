import { ChainedTokenCredential, ClientSecretCredential, ManagedIdentityCredential } from '@dvsa/ftts-auth-client';
import { mocked } from 'ts-jest/utils';
import DynamicsWebApi from 'dynamics-web-api';
import { newDynamicsWebApi, onTokenRefresh, getChainedTokenCredential } from '../../../src/dependencies/dynamics-web-api';
import { logger } from '../../../src/logger';
import config from '../../../src/config';

jest.mock('@dvsa/ftts-auth-client');
jest.mock('../../../src/logger');

const mockedChainedTokenCredential = mocked(ChainedTokenCredential, true);
const mockedManagedIdentityCredential = mocked(ManagedIdentityCredential, true);
const mockedClientSecretCredential = mocked(ClientSecretCredential, true);

describe('Dynamics Web Api', () => {
  beforeEach(() => {
    config.crm.auth = {
      url: 'mock-url',
      clientId: 'mock-client-id',
      clientSecret: 'mock-client-secret',
      tenantId: 'mock-tenant-id',
      resource: 'mock-resource',
      scope: 'mock-scope',
      userAssignedEntityClientId: 'mock-user-assigned-id',
    };
  });

  describe('getChainedTokenCredential', () => {

    afterEach(() => {
      jest.resetAllMocks();
    });

    test('GIVEN a client id, user assigned entity client id, tenant id and client secret WHEN called THEN creates chained credential with managed identity and client credential', () => {
      getChainedTokenCredential();

      expect(mockedManagedIdentityCredential.prototype.constructor).toHaveBeenCalledWith('mock-user-assigned-id');
      expect(mockedClientSecretCredential.prototype.constructor).toHaveBeenCalledWith('mock-tenant-id', 'mock-client-id', 'mock-client-secret');
      expect(mockedChainedTokenCredential.prototype.constructor).toHaveBeenCalledWith(expect.any(ManagedIdentityCredential), expect.any(ClientSecretCredential));
    });

    test('GIVEN a user assigned entity client id WHEN called THEN creates chained credential with managed identity', () => {
      config.crm.auth.clientId = '';
      config.crm.auth.clientSecret = '';
      config.crm.auth.tenantId = '';

      getChainedTokenCredential();

      expect(mockedManagedIdentityCredential.prototype.constructor).toHaveBeenCalledWith('mock-user-assigned-id');
      expect(mockedChainedTokenCredential.prototype.constructor).toHaveBeenCalledWith(expect.any(ManagedIdentityCredential));
    });

    test('GIVEN a missing user assigned entity client id WHEN called THEN creates client secret credential only', () => {
      config.crm.auth.userAssignedEntityClientId = '';

      getChainedTokenCredential();

      expect(mockedManagedIdentityCredential.prototype.constructor).not.toHaveBeenCalled();
      expect(mockedChainedTokenCredential.prototype.constructor).toHaveBeenCalledWith(expect.any(ClientSecretCredential));
    });
  });

  describe('onTokenRefresh', () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
      console.error = originalConsoleError;
    });

    afterEach(() => {
      jest.resetAllMocks();
    });
    
    test('GIVEN valid credentials WHEN called THEN returns a new token', async () => {
      const expectedToken = {
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs',
      };

      mockedChainedTokenCredential.prototype.getToken = jest.fn().mockResolvedValue(expectedToken);

      let actualToken: string | undefined;

      const callback: (token: string) => void = (token) => {
        actualToken = token;
      };
      await onTokenRefresh(callback);

      expect(mockedChainedTokenCredential.prototype.getToken).toHaveBeenCalledWith('mock-scope');
      expect(actualToken).toEqual(expectedToken.token);
    });

    test('GIVEN invalid credentials, callback is called with a blank string', async () => {
      mockedChainedTokenCredential.prototype.getToken = jest.fn().mockRejectedValue(new Error('invalid credentials'));
      const callback = jest.fn();

      await onTokenRefresh(callback);

      expect(callback).toHaveBeenCalledWith('');
      expect(logger.error).toHaveBeenCalledWith(Error('invalid credentials'), 'dynamics-web-api::onTokenRefresh: Failed to authenticate with CRM - invalid credentials');
    });
  });

  describe('newDynamicsWebApi', () => {
    test('should return a new DynamicsWebApi', () => {
      const result = newDynamicsWebApi();
      expect(result instanceof DynamicsWebApi).toBe(true);
    });
  });
});
