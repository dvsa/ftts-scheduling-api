/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Context } from '@azure/functions';
import { logger } from '../logger';
import { TCNError } from './errors';
import { SchedulingError } from './scheduling-error';

export const handler = async (context: Context, controller: (context: Context) => Promise<unknown>, functionName: string): Promise<void> => {
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
    if ((error as object).hasOwnProperty('code')) {
      const objectWithCode = error as { code: string };
      const status = determineResponseStatus(objectWithCode.code);
      logger.critical(`${functionName}::handler: - Exception has been caught returning status code: ${objectWithCode.code}`, { error: error as Error });
      context.res = {
        ...context.res,
        status,
        headers: {
          ...context.res?.headers,
          ...(error instanceof TCNError && error.retryAfter && { 'retry-after': error.retryAfter }),
        },
        body: determineResponseBody(error),
      };
    } else {
      logger.error(error as Error, `${functionName}::handler: - Unknown Exception caught - ${(error as Error)?.message}`);
      throw error;
    }
  }
  context.done();
};

const determineResponseStatus = (code: string): string => !Number.isNaN(Number(code)) ? code : '500';  // if code is not numeric (network errors), translate it to 500

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const determineResponseBody = (error: any): any => {
  if ((error instanceof TCNError || error instanceof SchedulingError)) {
    return error.toResponse();
  }
  // axios error object may contain request headers (with tokens), so we have to reduce properties to the most important and secure
  const { code, message, stack, errno } = error;
  return { code, message, stack, errno };
};
