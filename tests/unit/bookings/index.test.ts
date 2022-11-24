import { Context, HttpRequest } from '@azure/functions';
import { httpTriggerContextWrapper } from '@dvsa/azure-logger';

import httpTrigger from '../../../src/bookings/index';

describe('httpTrigger', () => {
  const context = {} as Context;
  const request = {} as HttpRequest;

  beforeEach(() => {
    context.res = {};
    context.done = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('correctly calls the handler', async () => {
    await httpTrigger(context, request);

    expect(httpTriggerContextWrapper).toHaveBeenCalledWith(expect.any(Function), context, request);
  });
});
