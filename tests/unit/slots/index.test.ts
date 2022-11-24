import { Context, HttpRequest } from '@azure/functions';
import { httpTriggerContextWrapper } from '@dvsa/azure-logger';

import httpTrigger from '../../../src/slots';

jest.mock('../../../src/utils/handler');

describe('httpTrigger', () => {
  const context = {} as Context;
  const request = {} as HttpRequest;

  test('correctly calls the handler', async () => {
    await httpTrigger(context, request);

    expect(httpTriggerContextWrapper).toHaveBeenCalledWith(expect.any(Function), context, request);
  });
});
