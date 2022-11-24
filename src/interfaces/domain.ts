import { TCNRegion } from '../enums';

export interface SlotsRequest {
  testCentreId: string;
  testTypes: string;
  dateFrom: string;
  dateTo: string;
  preferredDate?: string;
}

export interface ReservationsRequest {
  testCentreId: string;
  testTypes: string[];
  startDateTime: string;
  quantity: number;
  lockTime: number;
}

export interface Slot {
  testCentreId: string;
  testTypes: string[];
  startDateTime: string;
  quantity: number;
  dateAvailableOnOrBeforePreferredDate?: string;
  dateAvailableOnOrAfterPreferredDate?: string;
  dateAvailableOnOrAfterToday?: string;
}

export interface Reservation {
  testCentreId: string;
  testTypes: string[];
  startDateTime: string;
  reservationId: string;
}

export interface BookingRequest {
  bookingReferenceId: string;
  reservationId: string;
  notes: string;
  behaviouralMarkers: string;
}

export type PutBookingRequest = Pick<BookingRequest, 'notes' | 'behaviouralMarkers'>;

export type NotesBehaviouralMarkers = Pick<BookingRequest, 'notes' | 'behaviouralMarkers'>;

export interface BookingResponse {
  reservationId: string;
  status: string;
  message: string;
}

export interface BookingFullResponse {
  bookingReferenceId: string;
  reservationId: string;
  testCentreId: string;
  startDateTime: string;
  testTypes: string[];
  notes: string;
  behaviouralMarkers: string;
}

export interface TCNResponse {
  error_message?: string;
}

export interface TCNSlotsResponse extends TCNResponse {
  data: Slot[];
}

export interface TCNReservationResponse extends TCNResponse {
  data: Reservation[];
}

export interface TCNBookingResponse<T> extends TCNResponse {
  data: T;
}

export interface ErrorResponse {
  code: number;
  message: string;
}

export interface BookingProduct {
  bookingProductId: string;
  bookingId: string;
  candidateId?: string;
  reference: string;
  testDate?: string;
  tcnSlotDataUpdatedOn?: string;
  tcnUpdateDate?: string;
  tcnRegion: TCNRegion;
}

export interface BehaviouralMarker {
  behaviouralMarkerId: string;
  candidateId: string;
  caseId?: string;
  description?: string;
  removalReason?: number;
  removalReasonDetails?: string;
  updateReason?: number;
  updateReasonDetails?: string;
  blockedFromBookingOnline?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface BookingProductAndMarkers extends BookingProduct {
  behaviouralMarkers: BehaviouralMarker[];
}
