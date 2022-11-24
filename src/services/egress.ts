import { addressParser, Address, InternalAccessDeniedError } from '@dvsa/egress-filtering';
import config from '../config';
import { BusinessTelemetryEvent, logger } from '../logger';

const getAllowedAddresses: Address[] = [
  addressParser.parseUri(config.crm.auth.resource),
  { host: config.redisClient.host, port: config.redisClient.port },
];

config.tcn.urls.forEach((value: string | undefined) => {
  if (value) {
    getAllowedAddresses.push(addressParser.parseUri(value));
  }
});

const onInternalAccessDeniedError = (error: InternalAccessDeniedError): void => {
  logger.security('Egress::OnInternalAccessDeniedError: url is not whitelisted so it cannot be called', {
    host: error.host,
    port: error.port,
    reason: JSON.stringify(error),
  });

  logger.event(BusinessTelemetryEvent.SCHEDULING_EGRESS_ERROR, error.message, {
    host: error.host,
    port: error.port,
    reason: JSON.stringify(error),
  });

  throw error;
};

export {
  getAllowedAddresses,
  onInternalAccessDeniedError,
};
