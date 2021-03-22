import { Context } from '@azure/functions';
import logger from '../logger';
import { TCNError } from './errors';
import { SchedulingError } from './scheduling-error';

export const handler = async (context: Context, controller: Function, functionName: string): Promise<void> => {
  logger.event('Launch', functionName);
  context.res = {
    ...context.res,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  try {
    context.res.body = await controller(context);
    if (context.req?.method === 'DELETE') {
      context.res.status = 204;
    }
  } catch (error) {
    if (error.code) {
      logger.critical(`${functionName}::handler:: - Exception has been caught returning status code: ${error.code}`, { error });
      context.res = {
        ...context.res,
        status: error.code,
        body: (error instanceof TCNError || error instanceof SchedulingError) ? error.toResponse() : error,
      };
    } else {
      throw error;
    }
  }
  context.done();
};
