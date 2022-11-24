/* eslint-disable no-underscore-dangle */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { RetrieveMultipleRequest } from 'dynamics-web-api';
import { newDynamicsWebApi } from '../dependencies/dynamics-web-api';
import { BookingStatus, TCNRegion } from '../enums';
import { CRMBatchMarkerResponse, CRMBehaviouralMarker, CRMBookingProduct, CRMTestCentre } from '../interfaces/crm';
import { BehaviouralMarker, BookingProduct } from '../interfaces/domain';
import { BusinessTelemetryEvent, logger } from '../logger';

type CRMError = {
  status: number;
  message: string
};

export class CRMService {
  private static instance: CRMService;

  constructor(
    private dynamicsWebApi: DynamicsWebApi,
  ) { }

  public static getInstance(): CRMService {
    if (!CRMService.instance) {
      const dynamicsWebApi = newDynamicsWebApi();
      CRMService.instance = new CRMService(dynamicsWebApi);
    }
    return CRMService.instance;
  }

  /**
   * Retrieves booking products which meet ALL of the following conditions:
   * - ftts_tcnslotdataupdatedon is after ftts_tcn_update_date
   * - ftts_bookingstatus is not cancelled
   * - ftts_testdate is on or after today
   * @returns Booking products with CRM properties converted to natural language which need synced
   */
  public async getUnsyncedBookingProducts(): Promise<BookingProduct[]> {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    try {
      const bookingProductFields = ['ftts_bookingproductid', '_ftts_bookingid_value', '_ftts_candidateid_value', 'ftts_reference', 'ftts_tcnslotdataupdatedon', 'ftts_tcn_update_date', 'ftts_testdate'];
      const filterUpdatedSlotBookings = 'ftts_tcnslotdataupdatedon ne null and _ftts_candidateid_value ne null and ftts_tcnslotdataupdatedon gt ftts_tcn_update_date';
      const filterCancelledBookings = `ftts_bookingstatus ne ${BookingStatus.CANCELLED}`;
      const filterBookingsOnOrAfterToday = `Microsoft.Dynamics.CRM.OnOrAfter(PropertyName='ftts_testdate',PropertyValue='${dayjs().tz('Europe/London').startOf('day').toISOString()}')`;

      const request: RetrieveMultipleRequest = {
        collection: 'ftts_bookingproducts',
        select: bookingProductFields,
        filter: [filterUpdatedSlotBookings, filterCancelledBookings, filterBookingsOnOrAfterToday].join(' and '),
        expand: [
          {
            property: 'ftts_bookingid',
            expand: [{
              property: 'ftts_testcentre',
              expand: [{
                property: 'parentaccountid',
                select: ['ftts_regiona', 'ftts_regionb', 'ftts_regionc'],
              }],
            }],
          },
        ],
      };

      logger.debug('CRMService::getUnsyncedBookingProducts: Request', { request });
      const response = await this.dynamicsWebApi.retrieveMultipleRequest<CRMBookingProduct>(request);
      logger.debug('CRMService::getUnsyncedBookingProducts: Response', { response });

      if (!response.value?.length) {
        return [];
      }

      const result: BookingProduct[] = [];
      response.value.forEach((crmBookingProduct) => {
        try {
          result.push({
            bookingProductId: crmBookingProduct.ftts_bookingproductid,
            bookingId: crmBookingProduct._ftts_bookingid_value,
            candidateId: crmBookingProduct._ftts_candidateid_value,
            reference: crmBookingProduct.ftts_reference,
            testDate: crmBookingProduct.ftts_testdate,
            tcnSlotDataUpdatedOn: crmBookingProduct.ftts_tcnslotdataupdatedon,
            tcnUpdateDate: crmBookingProduct.ftts_tcn_update_date,
            tcnRegion: this.getTCNRegion(crmBookingProduct.ftts_bookingid.ftts_testcentre),
          });
        } catch (error) {
          logger.error(
            error as Error,
            `CRMService::getUnsyncedBookingProducts: Error mapping CRM booking product ${crmBookingProduct.ftts_bookingproductid} - skipping record`,
            { bookingProductId: crmBookingProduct.ftts_bookingproductid },
          );
        }
      });
      return result;
    } catch (error) {
      const crmError = error as CRMError;
      this.logCrmEvent(crmError.status);
      logger.critical(`CRMService::getUnsyncedBookingProducts: Could not retrieve booking products from CRM - ${crmError.message}`, { error: crmError });
      throw error;
    }
  }

  public async getBehaviouralMarkersBatch(candidateIds: string[]): Promise<BehaviouralMarker[]> {
    try {
      this.dynamicsWebApi.startBatch();
      candidateIds.forEach((candidateId) => {
        this.getBehaviouralMarkersRequest([candidateId]);
      });
      const response: CRMBatchMarkerResponse[] = await this.dynamicsWebApi.executeBatch() as CRMBatchMarkerResponse[];
      logger.debug('CRMService::getBehaviouralMarkersBatch: Response', { response });

      const behaviouralMarkers = response
        .flatMap((markerResponse: CRMBatchMarkerResponse) => markerResponse.value)
        .map((crmBehaviouralMarker: CRMBehaviouralMarker) => this.mapToBehaviouralMarker(crmBehaviouralMarker));

      return behaviouralMarkers;
    } catch (error) {
      const crmError = error as CRMError;
      this.logCrmEvent(crmError.status);
      logger.critical(`CRMService::getBehaviouralMarkersBatch: Could not retrieve batched behavioural markers from CRM - ${crmError.message}`, { error: crmError, candidateIds });
      throw error;
    }
  }

  public async updateTCNUpdateDate(bookingProductId: string): Promise<void> {
    try {
      const request = {
        key: bookingProductId,
        collection: 'ftts_bookingproducts',
        entity: {
          ftts_tcn_update_date: dayjs().toISOString(),
        },
      };
      logger.debug(`CRMService::updateTCNUpdateDate: Raw Request: ${JSON.stringify(request)}`);
      await this.dynamicsWebApi.updateRequest(request);
    } catch (error) {
      this.logCrmEvent((error as CRMError).status);
      logger.critical(`CRMService::updateTCNUpdateDate: Could not set the TCN update date on booking product ${bookingProductId}`, { bookingProductId });
      throw error;
    }
  }

  private getBehaviouralMarkersRequest(candidateIds: string[]): void {
    const behaviouralMarkerFields = [
      'ftts_behaviouralmarkerid',
      '_ftts_personid_value',
      '_ftts_caseid_value',
      'ftts_description',
      'ftts_removalreason',
      'ftts_removalreasondetails',
      'ftts_updatereason',
      'ftts_updatereasondetails',
      'ftts_blockedfrombookingonline',
      'ftts_startdate',
      'ftts_enddate',
    ];

    const filter = '_ftts_personid_value eq ';
    const candidateIdsFilter = candidateIds.map((candidateId) => `'${candidateId}'`).join(` or ${filter}`);
    const filterQuery = `${filter} ${candidateIdsFilter}`;
    const request: RetrieveMultipleRequest = {
      collection: 'ftts_behaviouralmarkers',
      select: behaviouralMarkerFields,
      filter: filterQuery,
    };
    logger.debug('CRMService::getBehaviouralMarkersRequest: Raw Request', { request });

    // Request is only used as part of a batch so we don't want to have an await
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.dynamicsWebApi.retrieveMultipleRequest<CRMBehaviouralMarker>(request);
  }

  private mapToBehaviouralMarker(crmBehaviouralMarker: CRMBehaviouralMarker): BehaviouralMarker {
    return {
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
    };
  }

  private getTCNRegion(centre: CRMTestCentre): TCNRegion {
    if (centre.parentaccountid.ftts_regiona) {
      return TCNRegion.A;
    }
    if (centre.parentaccountid.ftts_regionb) {
      return TCNRegion.B;
    }
    if (centre.parentaccountid.ftts_regionc) {
      return TCNRegion.C;
    }
    throw new Error(`CRMService::getTCNRegion: Unable to get region from CRM test centre record ${centre.accountid} - all region values are false/missing`);
  }

  private logCrmEvent(status: number | undefined): void {
    if (!status) return;
    if (status === 401 || status === 403) {
      logger.event(BusinessTelemetryEvent.BMS_CDS_AUTH_ERROR);
    } else if (status >= 400 && status <= 499) {
      logger.event(BusinessTelemetryEvent.BMS_CDS_FAIL);
    } else if (status === 502 || status === 503 || status === 504) {
      logger.event(BusinessTelemetryEvent.BMS_CDS_CONNECTION_ERROR);
    } else if (status === 500) {
      logger.event(BusinessTelemetryEvent.BMS_CDS_ERROR);
    }
  }
}
