import { ErrorResponse } from '../interfaces';

/**
 * A type of error to be thrown in the bookings controller (other endpoints WIP) for outgoing request validtion
 * Matches the structure of the stub TCN Error.
 */
export class SchedulingError extends Error {
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
