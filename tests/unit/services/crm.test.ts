/* eslint-disable no-underscore-dangle */
import { RetrieveMultipleRequest } from 'dynamics-web-api';
import MockDate from 'mockdate';
import { TCNRegion } from '../../../src/enums';
import { logger } from '../../../src/logger';
import { CRMService } from '../../../src/services/crm';
import { mockCRMBehaviouralMarkers, mockCRMBookingProducts } from '../../stubs/crm';

jest.mock('axios');
jest.mock('dynamics-web-api');
jest.mock('../../../src/logger');

const mockError = {
  message: 'Error message',
  status: 500,
  toString: () => 'Mock Error',
};
const mockDateGMT = new Date('2020-11-11T14:30:45.979Z'); // GMT+0000
const startOfMockDateGMT = new Date(mockDateGMT);
startOfMockDateGMT.setHours(0, 0, 0, 0);
const startOfMockDateGMTISOstring = startOfMockDateGMT.toISOString();

const mockDateBST = new Date('2020-06-11T14:30:45.979Z'); // GMT+0100
const startOfMockDateBST = new Date(mockDateBST);
startOfMockDateBST.setHours(0, 0, 0, 0);
const startOfMockDateBSTISOstring = startOfMockDateBST.toISOString();

describe('CRM Service', () => {
  let crmService: CRMService;
  const mockDynamicsWebApi = {
    startBatch: jest.fn(),
    retrieveMultipleRequest: jest.fn(),
    executeBatch: jest.fn(),
    updateRequest: jest.fn(),
  };

  beforeEach(() => {
    MockDate.set(mockDateGMT);
    crmService = new CRMService(mockDynamicsWebApi as unknown as DynamicsWebApi);
  });

  afterEach(() => {
    MockDate.reset();
    jest.resetAllMocks();
  });

  describe('getUnsyncedBookingProducts', () => {
    test.each([
      ['GMT', mockDateGMT, startOfMockDateGMTISOstring],
      ['BST', mockDateBST, startOfMockDateBSTISOstring],
    ])('retrieve mapped booking products when today is in the %s timezone', async (_, mockDate, expectedTimezoneAdjustedISOstring) => {
      MockDate.set(mockDate);

      mockDynamicsWebApi.retrieveMultipleRequest.mockResolvedValueOnce({
        value: mockCRMBookingProducts(),
      });
      const crmBookingProduct = mockCRMBookingProducts()[0];

      const bookingProducts = await crmService.getUnsyncedBookingProducts();

      expect(mockDynamicsWebApi.retrieveMultipleRequest).toHaveBeenCalledWith(
        expect.objectContaining<RetrieveMultipleRequest>({
          collection: 'ftts_bookingproducts',
          select: ['ftts_bookingproductid', '_ftts_bookingid_value', '_ftts_candidateid_value', 'ftts_reference', 'ftts_tcnslotdataupdatedon', 'ftts_tcn_update_date', 'ftts_testdate'],
          expand: [{
            expand: [{
              expand: [{
                property: 'parentaccountid',
                select: ['ftts_regiona', 'ftts_regionb', 'ftts_regionc'],
              }],
              property: 'ftts_testcentre',
            }],
            property: 'ftts_bookingid',
          }],
          filter: `ftts_tcnslotdataupdatedon ne null and _ftts_candidateid_value ne null and ftts_tcnslotdataupdatedon gt ftts_tcn_update_date and ftts_bookingstatus ne 675030008 and Microsoft.Dynamics.CRM.OnOrAfter(PropertyName='ftts_testdate',PropertyValue='${expectedTimezoneAdjustedISOstring}')`,
        }),
      );
      expect(bookingProducts).toHaveLength(3);
      expect(bookingProducts[0]).toStrictEqual({
        bookingProductId: crmBookingProduct.ftts_bookingproductid,
        bookingId: crmBookingProduct._ftts_bookingid_value,
        candidateId: crmBookingProduct._ftts_candidateid_value,
        reference: crmBookingProduct.ftts_reference,
        testDate: crmBookingProduct.ftts_testdate,
        tcnSlotDataUpdatedOn: crmBookingProduct.ftts_tcnslotdataupdatedon,
        tcnUpdateDate: crmBookingProduct.ftts_tcn_update_date,
        tcnRegion: TCNRegion.A,
      });
    });

    test('logs and throws an error if the call to CRM fails', async () => {
      mockDynamicsWebApi.retrieveMultipleRequest.mockRejectedValue(mockError);

      await expect(crmService.getUnsyncedBookingProducts()).rejects.toStrictEqual(mockError);

      expect(logger.event).toHaveBeenCalledWith('BMS_CDS_ERROR');
      expect(logger.critical).toHaveBeenCalledWith(
        expect.stringContaining('CRMService::getUnsyncedBookingProducts: Could not retrieve booking products from CRM'),
        expect.objectContaining({}),
      );
    });

    test.each([
      ['GMT', mockDateGMT, startOfMockDateGMTISOstring],
      ['BST', mockDateBST, startOfMockDateBSTISOstring],
    ])('in the %s timezone logs error and skips record if mapping fails', async (_, mockDate, expectedTimezoneAdjustedISOstring) => {
      MockDate.set(mockDate);

      const mockBookingProducts = mockCRMBookingProducts();
      mockBookingProducts[0].ftts_bookingid.ftts_testcentre = null;
      mockDynamicsWebApi.retrieveMultipleRequest.mockResolvedValue({
        value: mockBookingProducts,
      });

      const bookingProducts = await crmService.getUnsyncedBookingProducts();

      expect(mockDynamicsWebApi.retrieveMultipleRequest).toHaveBeenCalledWith(
        expect.objectContaining<RetrieveMultipleRequest>({
          collection: 'ftts_bookingproducts',
          select: ['ftts_bookingproductid', '_ftts_bookingid_value', '_ftts_candidateid_value', 'ftts_reference', 'ftts_tcnslotdataupdatedon', 'ftts_tcn_update_date', 'ftts_testdate'],
          expand: [{
            expand: [{
              expand: [{
                property: 'parentaccountid',
                select: ['ftts_regiona', 'ftts_regionb', 'ftts_regionc'],
              }],
              property: 'ftts_testcentre',
            }],
            property: 'ftts_bookingid',
          }]
          ,
          filter: `ftts_tcnslotdataupdatedon ne null and _ftts_candidateid_value ne null and ftts_tcnslotdataupdatedon gt ftts_tcn_update_date and ftts_bookingstatus ne 675030008 and Microsoft.Dynamics.CRM.OnOrAfter(PropertyName='ftts_testdate',PropertyValue='${expectedTimezoneAdjustedISOstring}')`,
        }),
      );
      expect(bookingProducts).toHaveLength(2);
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining('CRMService::getUnsyncedBookingProducts: Error mapping CRM booking product'),
        expect.objectContaining({ bookingProductId: mockCRMBookingProducts()[0].ftts_bookingproductid }),
      );
    });
  });

  describe('getBehaviouralMarkersBatch', () => {
    test('retrieve behavioural markers', async () => {
      mockDynamicsWebApi.executeBatch.mockResolvedValue([
        {
          value: mockCRMBehaviouralMarkers(),
        },
      ]);
      const crmBehaviouralMarker = mockCRMBehaviouralMarkers()[0];

      const behaviouralMarkers = await crmService.getBehaviouralMarkersBatch(['mockCandidateId']);

      expect(behaviouralMarkers[0]).toStrictEqual({
        behaviouralMarkerId: crmBehaviouralMarker.ftts_behaviouralmarkerid,
        candidateId: crmBehaviouralMarker._ftts_personid_value,
        caseId: crmBehaviouralMarker._ftts_caseid_value,
        description: crmBehaviouralMarker.ftts_description,
        removalReason: crmBehaviouralMarker.ftts_removalreason,
        removalReasonDetails: crmBehaviouralMarker.ftts_removalreasondetails,
        updateReason: crmBehaviouralMarker.ftts_updatereason,
        updateReasonDetails: crmBehaviouralMarker.ftts_updatereasondetails,
        blockedFromBookingOnline: crmBehaviouralMarker.ftts_blockedfrombookingonline,
        startDate: crmBehaviouralMarker.ftts_startdate,
        endDate: crmBehaviouralMarker.ftts_enddate,
      });
    });

    test('logs and throws an error if the call to CRM fails', async () => {
      mockError.status = 418;
      mockDynamicsWebApi.executeBatch.mockRejectedValue(mockError);

      await expect(crmService.getBehaviouralMarkersBatch(['mock-candidate-id'])).rejects.toStrictEqual(mockError);

      expect(logger.event).toHaveBeenCalledWith('BMS_CDS_FAIL');
      expect(logger.critical).toHaveBeenCalledWith(
        expect.stringContaining('CRMService::getBehaviouralMarkersBatch: Could not retrieve batched behavioural markers from CRM'),
        expect.objectContaining({}),
      );
    });
  });

  describe('updateTCNUpdateDate', () => {
    test('sends call to update the TCN update date on the booking product', async () => {
      mockDynamicsWebApi.updateRequest.mockResolvedValue({});

      await crmService.updateTCNUpdateDate('booking-product-id');

      expect(mockDynamicsWebApi.updateRequest).toHaveBeenCalledWith(
        {
          collection: 'ftts_bookingproducts',
          entity: {
            ftts_tcn_update_date: '2020-11-11T14:30:45.979Z',
          },
          key: 'booking-product-id',
        },
      );
    });

    test('logs and throws an error if the call to CRM fails', async () => {
      mockError.status = 503;
      mockDynamicsWebApi.updateRequest.mockRejectedValue(mockError);
      const mockBookingProductId = 'booking-product-id';

      await expect(crmService.updateTCNUpdateDate(mockBookingProductId)).rejects.toStrictEqual(mockError);

      expect(logger.event).toHaveBeenCalledWith('BMS_CDS_CONNECTION_ERROR');
      expect(logger.critical).toHaveBeenCalledWith(
        expect.stringContaining(`CRMService::updateTCNUpdateDate: Could not set the TCN update date on booking product ${mockBookingProductId}`),
        expect.objectContaining({ bookingProductId: mockBookingProductId }),
      );
    });
  });
});
