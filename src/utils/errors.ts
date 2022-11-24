import { AxiosError } from 'axios';
import { TCNRegion } from '../enums';
import { ErrorResponse } from '../interfaces';
import { logger, logTcnError, logTcnEvent } from '../logger';

export const KNOWN_SLOTS_ERROR_CODES = [401, 403, 404, 429, 500, 503];
export const KNOWN_BOOKINGS_ERROR_CODES = [400, 401, 403, 404, 429, 500, 503];
export const KNOWN_RESERVATIONS_ERROR_CODES = [400, 401, 403, 409, 429, 500, 503];
export const KNOWN_RESERVATIONS_DELETE_ERROR_CODES = [400, 401, 403, 404, 429, 500, 503];

export const buildErrorResponse = (statusCode: number, message: string): ErrorResponse => ({
  code: statusCode,
  message,
});
export class TCNError extends Error {
  code: number;

  retryAfter?: number;

  constructor(code: number, message: string, retryAfter?: number) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = TCNError.name;
    this.code = code;
    this.retryAfter = retryAfter;
  }

  toResponse(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export const handleAxiosError = (error: AxiosError<ErrorResponse>, functionName: string, customMessage: string, errorCodes: number[], regionId: TCNRegion, businessIdentifiers: unknown): void => {
  logTcnEvent(error.response?.status);
  logTcnError(
    functionName,
    error.response?.status,
    error,
    customMessage,
    {
      regionId,
      businessIdentifiers,
      ...(error.response?.headers && { retryAfter: error.response.headers['retry-after'] }),
    },
  );
  logger.debug(`${functionName}:: ${customMessage}`, { response: error.response?.data });

  let retryAfterDuration: number | undefined;
  if (error.response?.headers && error.response.headers['retry-after']) {
    retryAfterDuration = parseInt(error.response.headers['retry-after'], 10);
  }

  if (error.response?.status && errorCodes.includes(error.response?.status)) {
    throw new TCNError(
      error.response.status,
      error.response.data?.message,
      retryAfterDuration,
    );
  } else {
    throw error;
  }
};
