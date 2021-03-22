import { ErrorResponse } from '../interfaces';

export const KNOWN_SLOTS_ERROR_CODES = [401, 403, 404, 500, 503];
export const KNOWN_BOOKINGS_ERROR_CODES = [401, 403, 404, 500, 503];
export const KNOWN_RESERVATIONS_ERROR_CODES = [401, 403, 409, 500, 503];
export const KNOWN_RESERVATIONS_DELETE_ERROR_CODES = [401, 403, 404, 500, 503];

export const buildErrorResponse = (statusCode: number, message: string): ErrorResponse => ({
  code: statusCode,
  message,
});

export class TCNError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }

  toResponse(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

type MockErrorResponse = { response: {status: number; data: { code: number; message: string }}};
export const mockTCNErrorResponse = (errorStatus: number): MockErrorResponse => ({
  response: {
    status: errorStatus,
    data: {
      code: errorStatus,
      message: '',
    },
  },
});
