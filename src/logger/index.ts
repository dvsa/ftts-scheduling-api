import { Logger } from '@dvsa/azure-logger';
import { Props } from '@dvsa/azure-logger/dist/ILogger';
import config from '../config/index';

export enum BusinessTelemetryEvent {
  SCHEDULING_EGRESS_ERROR = 'SCHEDULING_EGRESS_ERROR', // Request caught by egress functionality
  SCHEDULING_ERROR = 'SCHEDULING_ERROR', // External API returns 500 error
  SCHEDULING_RESERVATION_SUCCESS = 'SCHEDULING_RESERVATION_SUCCESS', // Successful post request for reservation
  SCHEDULING_SLOT_INVALID_ERROR = 'SCHEDULING_SLOT_INVALID_ERROR',
  SCHEDULING_AUTH_ERROR = 'SCHEDULING_AUTH_ERROR',
  SCHEDULING_CONNECTION_ERROR = 'SCHEDULING_CONNECTION_ERROR',
  SCHEDULING_BOOKING_CONFIRMATION_SUCCESS = 'SCHEDULING_BOOKING_CONFRIMATION_SUCCESS',
  BMS_ERROR = 'BMS_ERROR',
  BMS_CDS_AUTH_ERROR = 'BMS_CDS_AUTH_ERROR',
  BMS_CDS_FAIL = 'BMS_CDS_FAIL',
  BMS_CDS_CONNECTION_ERROR = 'BMS_CDS_CONNECTION_ERROR',
  BMS_CDS_ERROR = 'BMS_CDS_ERROR',
}

export const logger = new Logger('FTTS', config.websiteSiteName);

/**
 * Additionally delete can return 404 and reserve 409, for which no events have been provided
 * @param status the error code
 */
export const logTcnEvent = (status: number | undefined): void => {
  if (status === 401 || status === 403) {
    logger.event(BusinessTelemetryEvent.SCHEDULING_AUTH_ERROR);
  } else if (status === 502 || status === 503 || status === 504) {
    logger.event(BusinessTelemetryEvent.SCHEDULING_CONNECTION_ERROR);
  } else if (status === 500) {
    logger.event(BusinessTelemetryEvent.SCHEDULING_ERROR);
  }
};

export const logTcnError = (functionName: string, status: number | undefined, error: Error, customMessage?: string, props?: Props): void => {
  const logMessage = (customMessage)
    ? `${functionName}:: ${customMessage} ${error.message}`
    : `${functionName}:: Error: ${error.message}`;
  if (!status) {
    // log all other non-specified errors
    logger.warn(logMessage, { error, props });
    return;
  }
  if ([401, 403, 500, 503].includes(status)) {
    logger.critical(logMessage, { error, props });
  } else if ([400].includes(status)) {
    logger.error(error, logMessage, { props });
  } else if (status.toString().startsWith('4')) {
    // all other 4** error codes should output a logger.warn
    logger.warn(logMessage, { error, props });
  }
};
