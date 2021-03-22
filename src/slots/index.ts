import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { httpTriggerContextWrapper } from '@dvsa/azure-logger';

import SlotsController from './slots-controller';
import { handler } from '../utils';

const httpTrigger: AzureFunction = async (context: Context) => {
  await handler(context, SlotsController.getSlots, 'GET_SLOTS');
};

export default async (context: Context, req: HttpRequest): Promise<void> => {
  await httpTriggerContextWrapper(httpTrigger, context, req);
};
