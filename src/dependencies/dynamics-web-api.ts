import DynamicsWebApi from 'dynamics-web-api';
import { ChainedTokenCredential, ManagedIdentityCredential, ClientSecretCredential, TokenCredential } from '@dvsa/ftts-auth-client';

import config from '../config';
import { logger } from '../logger';

export const getChainedTokenCredential = (): ChainedTokenCredential => {
  const sources: TokenCredential[] = [];

  if (config.crm.auth.userAssignedEntityClientId) {
    sources.push(new ManagedIdentityCredential(config.crm.auth.userAssignedEntityClientId));
  }

  if (config.crm.auth.tenantId && config.crm.auth.clientId && config.crm.auth.clientSecret) {
    sources.push(new ClientSecretCredential(config.crm.auth.tenantId, config.crm.auth.clientId, config.crm.auth.clientSecret));
  }

  const chainedTokenCredential = new ChainedTokenCredential(
    ...sources,
  );

  return chainedTokenCredential;
};

export async function onTokenRefresh(dynamicsWebApiCallback: (token: string) => void): Promise<void> {
  try {
    const chainedTokenCredential = getChainedTokenCredential();
    logger.debug('dynamics-web-api::onTokenRefresh: Token credentials configured');
    const accessToken = await chainedTokenCredential.getToken(config.crm.auth.scope);
    logger.debug('dynamics-web-api::onTokenRefresh: Token obtained', {
      userAssignedClientId: config.crm.auth.userAssignedEntityClientId,
      isEmpty: accessToken == null,
    });
    dynamicsWebApiCallback(accessToken.token);
  } catch (error) {
    logger.error(error as Error, `dynamics-web-api::onTokenRefresh: Failed to authenticate with CRM - ${(error as Error).message}`);
    // Callback needs to be called - to prevent function from hanging
    dynamicsWebApiCallback('');
  }
}

export function newDynamicsWebApi(): DynamicsWebApi {
  return new DynamicsWebApi({
    webApiUrl: config.crm.apiUrl,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onTokenRefresh,
  });
}
