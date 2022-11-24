import {
  ChainedTokenCredential, ClientSecretCredential, ManagedIdentityCredential, TokenCredential,
} from '@dvsa/ftts-auth-client';
import config from '../config';
import { logger } from '../logger';

export type MangedIdentityAuthConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  userAssignedEntityClientId: string;
  scope: string;
};

export type AuthHeader = {
  headers: {
    Authorization: string;
  };
};

export class ManagedIdentityAuth {
  private static instance: ManagedIdentityAuth;

  public static getInstance(): ManagedIdentityAuth {
    if (!ManagedIdentityAuth.instance) {
      const identityConfig = config.tcn.identity;
      const sources: TokenCredential[] = [ new ManagedIdentityCredential(identityConfig.userAssignedEntityClientId) ];
      if (identityConfig.tenantId && identityConfig.clientId && identityConfig.clientSecret) {
        sources.push(new ClientSecretCredential(identityConfig.tenantId, identityConfig.clientId, identityConfig.clientSecret));
      }
      ManagedIdentityAuth.instance = new ManagedIdentityAuth(identityConfig, new ChainedTokenCredential(...sources));
    }
    return ManagedIdentityAuth.instance;
  }

  constructor(
    private identityConfig: MangedIdentityAuthConfig,
    private tokenCredential: TokenCredential,
  ) {}

  public async getAuthHeader(): Promise<AuthHeader> {
    const token = await this.getToken();
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  private async getToken(): Promise<string> {
    try {
      const activeToken = await this.tokenCredential.getToken(this.identityConfig.scope);
      logger.info('ManagedIdentityAuth::getToken: Token retrieved', { token: JSON.stringify(activeToken) });
      if (!activeToken?.token) {
        throw new Error('ManagedIdentityAuth::getToken: Auth call was successful but a invalid token object was returned');
      }
      return activeToken?.token;
    } catch (error) {
      logger.error(error as Error, 'ManagedIdentityAuth::getToken Unable to retrieve token');
      throw error;
    }
  }
}
