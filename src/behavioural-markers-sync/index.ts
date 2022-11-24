import { AzureFunction, Context } from '@azure/functions';
import { nonHttpTriggerContextWrapper } from '@dvsa/azure-logger';
import { withEgressFiltering } from '@dvsa/egress-filtering';

import syncController from './sync-controller';
import { BusinessTelemetryEvent, logger } from '../logger';
import { getAllowedAddresses, onInternalAccessDeniedError } from '../services/egress';

export const behaviouralMarkersSyncTimerTrigger: AzureFunction = async (): Promise<void> => {
  logger.info('Running behavioural markers sync');

  try {
    await syncController.processBehaviouralMarkers();
  } catch (error) {
    logger.event(BusinessTelemetryEvent.BMS_ERROR);
    throw error;
  }

  logger.info('Behavioural Markers Sync Finished');
};

export const index = async (context: Context): Promise<void> => nonHttpTriggerContextWrapper(
  withEgressFiltering(behaviouralMarkersSyncTimerTrigger, getAllowedAddresses, onInternalAccessDeniedError, logger),
  context,
);
