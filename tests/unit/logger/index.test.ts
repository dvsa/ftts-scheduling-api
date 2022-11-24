import { BusinessTelemetryEvent, logger, logTcnError, logTcnEvent } from '../../../src/logger';


describe('logger', () => {
  const error = new Error('Error Message');

  afterEach(() => jest.resetAllMocks());

  describe('logTcnEvent', () => {
    test.each([
      [401, BusinessTelemetryEvent.SCHEDULING_AUTH_ERROR],
      [403, BusinessTelemetryEvent.SCHEDULING_AUTH_ERROR],
      [500, BusinessTelemetryEvent.SCHEDULING_ERROR],
      [502, BusinessTelemetryEvent.SCHEDULING_CONNECTION_ERROR],
      [503, BusinessTelemetryEvent.SCHEDULING_CONNECTION_ERROR],
      [504, BusinessTelemetryEvent.SCHEDULING_CONNECTION_ERROR],
    ])('logs the correct event for a %d error', (statusCode, eventName) => {
      logTcnEvent(statusCode);
      expect(logger.event).toHaveBeenCalledWith(eventName);
    });

    test.each([
      [400],
      [404],
      [429],
    ])('does not log an event for a %d error', (statusCode) => {
      logTcnEvent(statusCode);
      expect(logger.event).not.toHaveBeenCalled();
    });
  });

  describe('logTcnError', () => {
    test('logs a warning message if there is no status code', () => {
      logTcnError('TEST', undefined, error);
      expect(logger.warn).toHaveBeenCalledWith('TEST:: Error: Error Message', { error });
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.critical).not.toHaveBeenCalled();
    });

    test('logs a error if the status code is 400', () => {
      logTcnError('TEST', 400, error, 'custom message', { a: 3 });
      expect(logger.error).toHaveBeenCalledWith(error, 'TEST:: custom message Error Message', { props: { a: 3 } });
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.critical).not.toHaveBeenCalled();
    });

    test.each([
      [401],
      [403],
      [500],
      [503],
    ])('logs a critical message if the status code is %d', (statusCode) => {
      logTcnError('TEST', statusCode, error, 'custom message', { a: 3 });
      expect(logger.critical).toHaveBeenCalledWith('TEST:: custom message Error Message', { error, props: { a: 3 } });
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    test('logs a warning message for a status code of 4xx which has not already been covered', () => {
      logTcnError('TEST', 429, error);
      expect(logger.warn).toHaveBeenCalledWith('TEST:: Error: Error Message', { error });
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.critical).not.toHaveBeenCalled();
    });

    test('does not log anything for a status code that is not 4xx, 500 or 503', () => {
      logTcnError('TEST', 515, error);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.critical).not.toHaveBeenCalled();
    });
  });
});
