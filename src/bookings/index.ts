import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { httpTriggerContextWrapper } from '@dvsa/azure-logger';
import { withEgressFiltering } from '@dvsa/egress-filtering';

import {
  getBooking,
  putBooking,
  deleteBooking,
  confirmBooking,
} from './bookings-controller';
import { logger } from '../logger';
import { getAllowedAddresses, onInternalAccessDeniedError } from '../services/egress';
import { handler } from '../utils';

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  switch (req.method) {
    case 'GET':
      await handler(context, getBooking, 'GET_BOOKING');
      break;
    case 'PUT':
      await handler(context, putBooking, 'PUT_BOOKING');
      break;
    case 'DELETE':
      await handler(context, deleteBooking, 'DELETE_BOOKING');
      break;
    case 'POST':
      await handler(context, confirmBooking, 'CONFIRM_BOOKING');
      break;
    default:
      // none
  }
};

export default async (context: Context, req: HttpRequest): Promise<void> => {
  await httpTriggerContextWrapper(withEgressFiltering(httpTrigger, getAllowedAddresses, onInternalAccessDeniedError, logger), context, req);
};
