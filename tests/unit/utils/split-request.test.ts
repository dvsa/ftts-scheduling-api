import { SlotsRequest } from '../../../src/interfaces';
import { splitIntoWeekLongRequests } from '../../../src/utils/split-request';

describe('splitIntoWeekLongRequests - splits a request into multiple requests each up to a week long', () => {
  const mockTestCentreId = '1234';
  const mockTestTypes = '%5B%22CAR%22%5D';

  test('5 weeks exactly', () => {
    const request: SlotsRequest = {
      testCentreId: mockTestCentreId,
      testTypes: mockTestTypes,
      dateFrom: '2021-01-29',
      dateTo: '2021-03-05',
    };

    const result = splitIntoWeekLongRequests(request);

    expect(result).toStrictEqual([
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-01-29',
        dateTo: '2021-02-05',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-02-06',
        dateTo: '2021-02-12',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-02-13',
        dateTo: '2021-02-19',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-02-20',
        dateTo: '2021-02-26',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-02-27',
        dateTo: '2021-03-05',
      },
    ]);
  });

  test('full calendar month', () => {
    const request: SlotsRequest = {
      testCentreId: mockTestCentreId,
      testTypes: mockTestTypes,
      dateFrom: '2021-03-01',
      dateTo: '2021-03-31',
    };

    const result = splitIntoWeekLongRequests(request);

    expect(result).toStrictEqual([
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-03-01',
        dateTo: '2021-03-08',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-03-09',
        dateTo: '2021-03-15',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-03-16',
        dateTo: '2021-03-22',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-03-23',
        dateTo: '2021-03-29',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-03-30',
        dateTo: '2021-03-31',
      },
    ]);
  });

  test('2 and a bit weeks', () => {
    const request: SlotsRequest = {
      testCentreId: mockTestCentreId,
      testTypes: mockTestTypes,
      dateFrom: '2021-01-29',
      dateTo: '2021-02-16',
    };

    const result = splitIntoWeekLongRequests(request);

    expect(result).toStrictEqual([
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-01-29',
        dateTo: '2021-02-05',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-02-06',
        dateTo: '2021-02-12',
      },
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-02-13',
        dateTo: '2021-02-16',
      },
    ]);
  });

  test('1 week', () => {
    const request: SlotsRequest = {
      testCentreId: mockTestCentreId,
      testTypes: mockTestTypes,
      dateFrom: '2021-01-29',
      dateTo: '2021-02-05',
    };

    const result = splitIntoWeekLongRequests(request);

    expect(result).toStrictEqual([
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-01-29',
        dateTo: '2021-02-05',
      },
    ]);
  });

  test('<1 week', () => {
    const request: SlotsRequest = {
      testCentreId: mockTestCentreId,
      testTypes: mockTestTypes,
      dateFrom: '2021-01-29',
      dateTo: '2021-02-03',
    };

    const result = splitIntoWeekLongRequests(request);

    expect(result).toStrictEqual([
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-01-29',
        dateTo: '2021-02-03',
      },
    ]);
  });

  test('1 day', () => {
    const request: SlotsRequest = {
      testCentreId: mockTestCentreId,
      testTypes: mockTestTypes,
      dateFrom: '2021-01-29',
      dateTo: '2021-01-29',
    };

    const result = splitIntoWeekLongRequests(request);

    expect(result).toStrictEqual([
      {
        testCentreId: mockTestCentreId,
        testTypes: mockTestTypes,
        dateFrom: '2021-01-29',
        dateTo: '2021-01-29',
      },
    ]);
  });
});
