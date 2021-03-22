import {
  isValidDate, validateRegionId, isValidTestCentreId, isValidTestTypes,
} from '../../../src/utils/validators';
import { SchedulingError } from '../../../src/utils/scheduling-error';

describe('validateRegionId', () => {
  test('returns the region id if it is valid', () => {
    expect(validateRegionId({ regionId: 'a' })).toBe('a');
  });
  test('returns the region id if it is valid', () => {
    expect(validateRegionId({ regionId: 'b' })).toBe('b');
  });
  test('returns the region id if it is valid', () => {
    expect(validateRegionId({ regionId: 'c' })).toBe('c');
  });
  test('throws an error if the region id is not valid', () => {
    expect(() => validateRegionId({ regionId: 'z' })).toThrow(SchedulingError);
  });
  test('throws an error if the region id is given in uppercase', () => {
    expect(() => validateRegionId({ regionId: 'A' })).toThrow(SchedulingError);
  });
});

describe('isValidTestCentreId', () => {
  test('returns true if test centre id is valid', () => {
    expect(isValidTestCentreId('1234567')).toEqual(true);
  });
  test('returns false if test centre id is less than 1 character', () => {
    expect(isValidTestCentreId('')).toEqual(false);
  });
  test('returns false if test centre id is over 72 characters', () => {
    expect(isValidTestCentreId('This is a really long test centre id which should be more then 72 characters long')).toEqual(false);
  });
  test('returns false if test centre id is not a string', () => {
    expect(isValidTestCentreId(null)).toEqual(false);
  });
});

describe('isValidTestTypes', () => {
  test('returns true if test types are valid', () => {
    expect(isValidTestTypes(['CAR'])).toEqual(true);
  });
  test('returns true if test types are valid and provided in lower case', () => {
    expect(isValidTestTypes(['car'])).toEqual(true);
  });
  test('returns false if test types are not valid', () => {
    expect(isValidTestTypes(['BOAT'])).toEqual(false);
  });
  test('returns false if test types are not valid and provided in lower case', () => {
    expect(isValidTestTypes(['boat'])).toEqual(false);
  });
});

describe('isValidDate', () => {
  test('returns true if the date is valid', () => {
    expect(isValidDate('2020-07-30T09:00:00.000Z')).toEqual(true);
  });
  test('returns true if the date is valid when using a formatter', () => {
    expect(isValidDate('2020-07-30', 'YYYY-MM-DD')).toEqual(true);
  });
  test('returns false if the date is invalid', () => {
    expect(isValidDate('2020-07-32T09:00:00.000Z')).toEqual(false);
  });
  test('returns false if the date format is incorrect', () => {
    expect(isValidDate('2020/07/30')).toEqual(false);
  });
  test('returns false if the date is invalid when using a formatter', () => {
    expect(isValidDate('2020-07-32', 'YYYY-MM-DD')).toEqual(false);
  });
  test('returns false if the date format is incorrect when using a formatter', () => {
    expect(isValidDate('2020/07/32', 'YYYY-MM-DD')).toEqual(false);
  });
});
