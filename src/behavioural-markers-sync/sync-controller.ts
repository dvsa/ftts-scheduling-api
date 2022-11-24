// We want to make requests sequentially
/* eslint-disable no-restricted-syntax */
import dayjs from 'dayjs';

import {
  BehaviouralMarker, BookingProduct, BookingProductAndMarkers, PutBookingRequest,
} from '../interfaces';
import { logger } from '../logger';
import { CRMService } from '../services/crm';
import * as BookingsService from '../services';
import { AxiosError } from 'axios';

export class SyncController {
  constructor(private crmService: CRMService) { }

  public async processBehaviouralMarkers(): Promise<void> {
    const bookingProductsWithMarkers = await this.getBookingProductsWithMarkers();

    logger.debug(`SyncController::processBehaviouralMarkers: ${JSON.stringify(bookingProductsWithMarkers)}`);

    for await (const item of bookingProductsWithMarkers) {
      try {
        const tcnRequest: PutBookingRequest = {
          behaviouralMarkers: item.behaviouralMarkers?.length > 0 ? 'Candidate has a behavioural marker' : '',
          notes: '',
        };
        await BookingsService.putBooking(item.tcnRegion, item.reference, tcnRequest);
        await this.crmService.updateTCNUpdateDate(item.bookingProductId);
        logger.info(`SyncController::processBehaviouralMarkers: Successfully updated TCN with reference ${item.reference}`, {
          ref: item.reference,
          bookingProductId: item.bookingProductId,
          candidateId: item.candidateId,
        });
      } catch (error) {
        logger.error(error as Error, `SyncController::processBehaviouralMarkers: Error processing booking reference ${item.reference}`, {
          ref: item.reference,
          bookingProductId: item.bookingProductId,
        });
        const status = ( error as { status: number }).status || (error as AxiosError).code || (error as AxiosError).response?.status;
        if (status === 401 || status === 403) {
          throw error; // Abort the whole run
        }
      }
    }
  }

  public async getBookingProductsWithMarkers(): Promise<BookingProductAndMarkers[]> {
    const bookingProducts: BookingProduct[] = await this.crmService.getUnsyncedBookingProducts();

    if (!bookingProducts || bookingProducts?.length === 0) {
      logger.debug('SyncController::getBookingProductsWithMarkers: Found zero booking products to update');
      return [];
    }

    const candidateIds = Array.from(new Set(bookingProducts.flatMap((bookingProduct: BookingProduct) => bookingProduct?.candidateId as string)));
    const behaviouralMarkers = await this.crmService.getBehaviouralMarkersBatch(candidateIds);

    return bookingProducts.map((bookingProduct: BookingProduct) => {
      const filteredBehaviouralMarkers = behaviouralMarkers
        .filter((behaviouralMarker: BehaviouralMarker) => behaviouralMarker.candidateId === bookingProduct.candidateId)
        .filter((behaviouralMarker: BehaviouralMarker) => this.filterByTime(bookingProduct, behaviouralMarker));

      return {
        ...bookingProduct,
        behaviouralMarkers: filteredBehaviouralMarkers,
      };
    });
  }

  private filterByTime(bookingProduct: BookingProduct, behaviouralMarker: BehaviouralMarker): boolean {
    const bookingTime = dayjs(bookingProduct.testDate);
    const startDate = dayjs(behaviouralMarker.startDate);
    const endDate = dayjs(behaviouralMarker.endDate);

    return bookingTime.isAfter(startDate) && bookingTime.isBefore(endDate);
  }
}

export default new SyncController(
  CRMService.getInstance(),
);
