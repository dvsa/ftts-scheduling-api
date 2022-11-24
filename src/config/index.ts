import { TCNRegion } from '../enums';

const useStub = process.env.USE_TCN_STUB === 'true';

const testTypes = new Set<string>();
testTypes.add('CAR');
testTypes.add('MOTORCYCLE');
testTypes.add('LGV_MC');
testTypes.add('LGV_HPT');
testTypes.add('LGV_CPC');
testTypes.add('LGV_CPC_C');
testTypes.add('PCV_MC');
testTypes.add('PCV_HPT');
testTypes.add('PCV_CPC');
testTypes.add('PCV_CPC_C');
testTypes.add('ADI_P1');
testTypes.add('ADI_HPT');
testTypes.add('ERS');
testTypes.add('TAXI');
testTypes.add('ADI_P1_DVA');
testTypes.add('AMI_P1');

const TCN_URLS = new Map<TCNRegion, string>([
  [TCNRegion.A, useStub ? process.env.TCN_STUB_URL || '' : process.env.TCN_REGION_A_URL || ''],
  [TCNRegion.B, useStub ? process.env.TCN_STUB_URL || '' : process.env.TCN_REGION_B_URL || ''],
  [TCNRegion.C, useStub ? process.env.TCN_STUB_URL || '' : process.env.TCN_REGION_C_URL || ''],
]);

export const TCN_REGIONS_PREFERRED_DATE_ENABLED = new Map<TCNRegion, boolean>([
  [TCNRegion.A, process.env.TCN_REGION_A_PREFERRED_DATE_ENABLED === 'true'],
  [TCNRegion.B, process.env.TCN_REGION_B_PREFERRED_DATE_ENABLED === 'true'],
  [TCNRegion.C, process.env.TCN_REGION_C_PREFERRED_DATE_ENABLED === 'true'],
]);

const crmBaseUrl = process.env.CRM_BASE_URL || '';

const redisPort = parseInt(process.env.REDIS_STORAGE_PORT || '6380', 10);
const redisTtl = parseInt(process.env.REDIS_TTL_DURATION || '60', 10);

interface RegionConfig {
  enabled: boolean;
  ttl: number;
}

export interface Config {
  websiteSiteName: string;
  cache: {
    enabled: boolean;
    redisTtl: number;
    keyPrefix: string;
    region: {
      a: RegionConfig;
      b: RegionConfig;
      c: RegionConfig;
    };
  };
  crm: {
    apiUrl: string;
    auth: {
      url: string;
      clientId: string;
      clientSecret: string;
      tenantId: string;
      resource: string;
      scope: string;
      userAssignedEntityClientId: string;
    };
  };
  redisClient: {
    host: string;
    auth_pass: string;
    port: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tls: any;
  };
  tcn: {
    testTypes: Set<string>;
    urls: Map<TCNRegion, string>;
    preferredDateEnabled: Map<TCNRegion, boolean>;
    identity: {
      tenantId: string;
      clientId: string;
      clientSecret: string;
      scope: string;
      userAssignedEntityClientId: string;
    };
  };
}

const config: Config = {
  websiteSiteName: process.env.WEBSITE_SITE_NAME || '',
  tcn: {
    testTypes,
    urls: TCN_URLS,
    preferredDateEnabled: TCN_REGIONS_PREFERRED_DATE_ENABLED,
    identity: {
      tenantId: process.env.TCN_API_TENANT_ID || '',
      clientId: process.env.TCN_API_CLIENT_ID || '',
      clientSecret: process.env.TCN_API_CLIENT_SECRET || '',
      scope: process.env.TCN_API_AAD_SCOPE || '',
      userAssignedEntityClientId: process.env.USER_ASSIGNED_ENTITY_CLIENT_ID || '',
    },
  },
  crm: {
    apiUrl: `${crmBaseUrl}/api/data/v9.1/`,
    auth: {
      url: process.env.CRM_TOKEN_URL || '',
      clientId: process.env.CRM_CLIENT_ID || '',
      clientSecret: process.env.CRM_CLIENT_SECRET || '',
      resource: crmBaseUrl,
      scope: process.env.CRM_SCOPE || '',
      tenantId: process.env.CRM_TENANT_ID || '',
      userAssignedEntityClientId: process.env.USER_ASSIGNED_ENTITY_CLIENT_ID || '',
    },
  },
  redisClient: {
    auth_pass: process.env.REDIS_STORAGE_PASSWORD || '',
    host: process.env.REDIS_STORAGE_URL || '',
    port: redisPort,
    tls: (redisPort === 6380 ? {
      servername: process.env.REDIS_STORAGE_URL || '',
    } : undefined),
  },
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    region: {
      a: {
        enabled: process.env.CACHE_REGION_A_ENABLED === 'true',
        ttl: parseInt(process.env.CACHE_REGION_A_TTL_DURATION || `${redisTtl}`, 10),
      },
      b: {
        enabled: process.env.CACHE_REGION_B_ENABLED === 'true',
        ttl: parseInt(process.env.CACHE_REGION_B_TTL_DURATION || `${redisTtl}`, 10),
      },
      c: {
        enabled: process.env.CACHE_REGION_C_ENABLED === 'true',
        ttl: parseInt(process.env.CACHE_REGION_C_TTL_DURATION || `${redisTtl}`, 10),
      },
    },
    redisTtl,
    keyPrefix: process.env.SCHEDULE_CACHE_KEY_PREFIX || 'schedulingCacheKey',
  },
};

export default config;
