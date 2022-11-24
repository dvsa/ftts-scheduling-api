import { Context } from '@azure/functions';
import { nonHttpTriggerContextWrapper } from '@dvsa/azure-logger';

import { index, behaviouralMarkersSyncTimerTrigger } from '../../../src/behavioural-markers-sync';
import syncController from '../../../src/behavioural-markers-sync/sync-controller';

jest.mock('../../../src/behavioural-markers-sync/sync-controller');

describe('Behavioural Markers Sync', () => {
  const mockContext = {
    req: {},
    res: {},
  } as Context;

  test('index function is triggered', async () => {
    await index(mockContext);

    expect(nonHttpTriggerContextWrapper).toHaveBeenCalledWith(expect.any(Function), mockContext);
  });

  test('calls process behavioural markers', async () => {
    await behaviouralMarkersSyncTimerTrigger(mockContext);

    expect(syncController.processBehaviouralMarkers).toHaveBeenCalled();
  });
});
