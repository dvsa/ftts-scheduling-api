import { buildErrorResponse } from '../../../src/utils/errors';

describe('buildErrorResponse', () => {
  test('error response built correctly', () => {
    // arrange
    const sc = 400;
    const ms = 'Example error';

    // act
    const actual = buildErrorResponse(sc, ms);

    // assert
    expect(actual).toStrictEqual({
      code: 400,
      message: 'Example error',
    });
  });
});
