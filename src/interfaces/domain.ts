export interface SlotsRequest {
  testCentreId: string;
  testTypes: string;
  dateFrom: string;
  dateTo: string;
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
