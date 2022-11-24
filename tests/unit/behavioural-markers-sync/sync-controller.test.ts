import { SyncController } from '../../../src/behavioural-markers-sync/sync-controller';
import { TCNRegion } from '../../../src/enums';
import { logger } from '../../../src/logger';
import { CRMService } from '../../../src/services/crm';
import { mockBehaviouralMarkers, mockBookingProducts } from '../../stubs/mapped-crm';
import * as BookingsService from '../../../src/services';

jest.mock('../../../src/logger');
jest.mock('../../../src/services/bookings', () => ({
  putBooking: jest.fn(),
}));

describe('SyncController', () => {
  let syncController: SyncController;
  let crmService: CRMService;

  beforeEach(() => {
    crmService = {
      getUnsyncedBookingProducts: jest.fn().mockResolvedValue(mockBookingProducts()),
      getBehaviouralMarkersBatch: jest.fn().mockResolvedValue(mockBehaviouralMarkers()),
      updateTCNUpdateDate: jest.fn(),
    } as unknown as CRMService;

    syncController = new SyncController(crmService as unknown as CRMService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('process behavioural markers', async () => {
    await syncController.processBehaviouralMarkers();

    expect(crmService.getUnsyncedBookingProducts).toHaveBeenCalled();
    expect(crmService.getBehaviouralMarkersBatch).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('SyncController::processBehaviouralMarkers:'));
  });

  test('retrieve booking products and markers', async () => {
    const bookingProductAndMarkers = await syncController.getBookingProductsWithMarkers();

    expect(bookingProductAndMarkers).toStrictEqual([
      {
        bookingProductId: 'mockBookingProductId',
        bookingId: 'mockBookingId',
        candidateId: 'mockCandidateId',
        reference: 'B-000-063-935-01',
        testDate: '2021-04-02T09:45:00Z',
        tcnSlotDataUpdatedOn: '2021-04-02T09:50:00Z',
        tcnUpdateDate: '2021-04-02T09:45:00Z',
        tcnRegion: TCNRegion.A,
        behaviouralMarkers: [
          {
            behaviouralMarkerId: 'mockBehaviouralMarkerId',
            candidateId: 'mockCandidateId',
            caseId: null,
            description: 'Caught cheating mock',
            removalReason: null,
            removalReasonDetails: '',
            updateReason: 675030004,
            updateReasonDetails: null,
            blockedFromBookingOnline: false,
            startDate: '2021-04-01',
            endDate: '2021-04-23',
          },
        ],
      },
      {
        bookingProductId: 'mockBookingProductId-2',
        bookingId: 'mockBookingId-2',
        candidateId: 'mockDifferentCandidateId',
        reference: 'B-000-063-935-02',
        testDate: '2021-04-02T09:45:00Z',
        tcnSlotDataUpdatedOn: '2021-04-02T09:50:00Z',
        tcnUpdateDate: '2021-04-02T09:45:00Z',
        tcnRegion: TCNRegion.B,
        behaviouralMarkers: [
          {
            behaviouralMarkerId: 'mockBehaviouralMarkerId',
            candidateId: 'mockDifferentCandidateId',
            caseId: null,
            description: 'Different candidate behaviour mock',
            removalReason: null,
            removalReasonDetails: '',
            updateReason: 675030004,
            updateReasonDetails: null,
            blockedFromBookingOnline: false,
            startDate: '2021-04-01',
            endDate: '2021-04-23',
          },
        ],
      },
      {
        bookingProductId: 'mockBookingProductId-3',
        bookingId: 'mockBookingId-3',
        candidateId: 'mockDifferentDifferentCandidateId',
        reference: 'B-000-063-935-03',
        testDate: '2021-04-02T09:45:00Z',
        tcnSlotDataUpdatedOn: '2021-04-02T09:50:00Z',
        tcnUpdateDate: '2021-04-02T09:45:00Z',
        tcnRegion: TCNRegion.C,
        behaviouralMarkers: [],
      },
    ]);
  });

  test('does not retrieve behavioural markers outside of the test date', async () => {
    const bookingProductAndMarkers = await syncController.getBookingProductsWithMarkers();

    expect(bookingProductAndMarkers).not.toStrictEqual(expect.arrayContaining([
      {
        bookingProduct: {
          bookingProductId: 'mockBookingProductId',
          bookingId: 'mockBookingId',
          candidateId: 'mockCandidateId',
          reference: 'B-000-063-935-01',
          testDate: '2021-04-02T09:45:00Z',
          tcnSlotDataUpdatedOn: '2021-04-02T09:50:00Z',
          tcnUpdateDate: '2021-04-02T09:45:00Z',
        },
        behaviouralMarkers: [
          {
            behaviouralMarkerId: 'mockBehaviouralMarkerId',
            candidateId: 'mockCandidateId',
            caseId: null,
            description: 'outdated behaviour mock',
            removalReason: null,
            removalReasonDetails: '',
            updateReason: 675030004,
            updateReasonDetails: null,
            blockedFromBookingOnline: false,
            startDate: '2020-01-01',
            endDate: '2020-01-23',
          },
        ],
      },
    ]));
  });

  test('does not retrieve behavioural markers for other candidates', async () => {
    const bookingProductAndMarkers = await syncController.getBookingProductsWithMarkers();

    expect(bookingProductAndMarkers).not.toStrictEqual(expect.arrayContaining([
      {
        bookingProduct: {
          bookingProductId: 'mockBookingProductId',
          bookingId: 'mockBookingId',
          candidateId: 'mockCandidateId',
          reference: 'B-000-063-935-01',
          testDate: '2021-04-02T09:45:00Z',
          tcnSlotDataUpdatedOn: '2021-04-02T09:50:00Z',
          tcnUpdateDate: '2021-04-02T09:45:00Z',
        },
        behaviouralMarkers: [
          {
            behaviouralMarkerId: 'mockBehaviouralMarkerId',
            candidateId: 'mockDifferentCandidateId',
            caseId: null,
            description: 'Different candidate behaviour mock',
            removalReason: null,
            removalReasonDetails: '',
            updateReason: 675030004,
            updateReasonDetails: null,
            blockedFromBookingOnline: false,
            startDate: '2021-04-01',
            endDate: '2021-04-23',
          },
        ],
      },
    ]));
  });

  test('for each booking product with behavioural markers, sends PUT request to TCN', async () => {
    await syncController.processBehaviouralMarkers();

    expect(crmService.getUnsyncedBookingProducts).toHaveBeenCalledTimes(1);
    expect(crmService.getBehaviouralMarkersBatch).toHaveBeenCalledTimes(1);
    expect(BookingsService.putBooking).toHaveBeenCalledTimes(3);
    expect(BookingsService.putBooking).toHaveBeenCalledWith(TCNRegion.A, 'B-000-063-935-01', {
      notes: '',
      behaviouralMarkers: 'Candidate has a behavioural marker',
    });
    expect(BookingsService.putBooking).toHaveBeenCalledWith(TCNRegion.B, 'B-000-063-935-02', {
      notes: '',
      behaviouralMarkers: 'Candidate has a behavioural marker',
    });
    expect(BookingsService.putBooking).toHaveBeenCalledWith(TCNRegion.C, 'B-000-063-935-03', {
      notes: '',
      behaviouralMarkers: '',
    });
  });

  test('for each booking product with behavioural markers, updates CRM TCN sent date', async () => {
    await syncController.processBehaviouralMarkers();

    expect(crmService.getUnsyncedBookingProducts).toHaveBeenCalledTimes(1);
    expect(crmService.getBehaviouralMarkersBatch).toHaveBeenCalledTimes(1);
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledTimes(3);
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledWith('mockBookingProductId');
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledWith('mockBookingProductId-2');
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledWith('mockBookingProductId-3');
  });

  test('logs error and skips to next record if TCN request fails', async () => {

    const mockedBookingService = BookingsService.putBooking as jest.MockedFunction<typeof BookingsService.putBooking>;
    mockedBookingService.mockRejectedValueOnce(new Error('TCN error'));

    await syncController.processBehaviouralMarkers();

    expect(crmService.getUnsyncedBookingProducts).toHaveBeenCalledTimes(1);
    expect(crmService.getBehaviouralMarkersBatch).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(BookingsService.putBooking).toHaveBeenCalledTimes(3);
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledTimes(2);
    expect(crmService.updateTCNUpdateDate).not.toHaveBeenCalledWith('mockBookingProductId');
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledWith('mockBookingProductId-2');
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledWith('mockBookingProductId-3');
  });

  test('logs error and skips to next record if CRM update fails', async () => {
    // eslint-disable-next-line jest/unbound-method
    const mockedCRMService = crmService.updateTCNUpdateDate as jest.MockedFunction<typeof crmService.updateTCNUpdateDate>;
    mockedCRMService.mockRejectedValueOnce(new Error('CRM error'));

    await syncController.processBehaviouralMarkers();

    expect(crmService.getUnsyncedBookingProducts).toHaveBeenCalledTimes(1);
    expect(crmService.getBehaviouralMarkersBatch).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(BookingsService.putBooking).toHaveBeenCalledTimes(3);
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledTimes(3);
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledWith('mockBookingProductId');
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledWith('mockBookingProductId-2');
    expect(crmService.updateTCNUpdateDate).toHaveBeenCalledWith('mockBookingProductId-3');
  });
});
