import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { httpTriggerContextWrapper } from '@dvsa/azure-logger';
import { withEgressFiltering } from '@dvsa/egress-filtering';

import { logger } from '../logger';
import { makeReservation, deleteReservation } from './reservations-controller';
import { getAllowedAddresses, onInternalAccessDeniedError } from '../services/egress';
import { handler } from '../utils';

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest) => {
  switch (req.method) {
    case 'POST':
      await handler(context, makeReservation, 'MAKE_RESERVATION');
      break;
    case 'DELETE':
      await handler(context, deleteReservation, 'DELETE_RESERVATION');
      break;
    default:
  }
};

export default async (context: Context, req: HttpRequest): Promise<void> => {
  await httpTriggerContextWrapper(withEgressFiltering(httpTrigger, getAllowedAddresses, onInternalAccessDeniedError, logger), context, req);
};
