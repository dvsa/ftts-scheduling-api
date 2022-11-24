import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { httpTriggerContextWrapper } from '@dvsa/azure-logger';
import { withEgressFiltering } from '@dvsa/egress-filtering';

import { logger } from '../logger';
import SlotsTbController from './slots-tb-controller';
import { getAllowedAddresses, onInternalAccessDeniedError } from '../services/egress';
import { handler } from '../utils';

const httpTrigger: AzureFunction = async (context: Context) => {
  await handler(context, SlotsTbController.getSlots, 'GET_SLOTS_TB');
};

export default async (context: Context, req: HttpRequest): Promise<void> => {
  await httpTriggerContextWrapper(withEgressFiltering(httpTrigger, getAllowedAddresses, onInternalAccessDeniedError, logger), context, req);
};
