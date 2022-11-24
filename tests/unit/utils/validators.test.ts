import {
  isValidDate, validateRegionId, isValidTestCentreId, isValidTestTypes,
} from '../../../src/utils/validators';
import { SchedulingError } from '../../../src/utils/scheduling-error';
import { TCNRegion } from '../../../src/enums';

describe('validateRegionId', () => {
  test('returns TCNRegion.A if a is provided', () => {
    expect(validateRegionId({ regionId: 'a' })).toBe(TCNRegion.A);
  });
  test('returns TCNRegion.B if b is provided', () => {
    expect(validateRegionId({ regionId: 'b' })).toBe(TCNRegion.B);
  });
  test('returns TCNRegion.C if c is provided', () => {
    expect(validateRegionId({ regionId: 'c' })).toBe(TCNRegion.C);
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
    expect(isValidTestCentreId('1234567')).toBe(true);
  });
  test('returns false if test centre id is less than 1 character', () => {
    expect(isValidTestCentreId('')).toBe(false);
  });
  test('returns false if test centre id is over 72 characters', () => {
    expect(isValidTestCentreId('This is a really long test centre id which should be more than 72 characters long')).toBe(false);
  });
  test('returns false if test centre id is not a string', () => {
    expect(isValidTestCentreId(null)).toBe(false);
  });
});

describe('isValidTestTypes', () => {
  test('returns true if test types are valid', () => {
    expect(isValidTestTypes(['CAR'])).toBe(true);
  });
  test('returns true if test types are valid and provided in lower case', () => {
    expect(isValidTestTypes(['car'])).toBe(true);
  });
  test('returns false if test types are not valid', () => {
    expect(isValidTestTypes(['BOAT'])).toBe(false);
  });
  test('returns false if test types are not valid and provided in lower case', () => {
    expect(isValidTestTypes(['boat'])).toBe(false);
  });
});

describe('isValidDate', () => {
  test('returns true if the date is valid', () => {
    expect(isValidDate('2020-07-30T09:00:00.000Z')).toBe(true);
  });
  test('returns true if the date is valid when using a formatter', () => {
    expect(isValidDate('2020-07-30', 'YYYY-MM-DD')).toBe(true);
  });
  test('returns false if the date is invalid', () => {
    expect(isValidDate('2020-07-32T09:00:00.000Z')).toBe(false);
  });
  test('returns false if the date format is incorrect', () => {
    expect(isValidDate('2020/07/30')).toBe(false);
  });
  test('returns false if the date is invalid when using a formatter', () => {
    expect(isValidDate('2020-07-32', 'YYYY-MM-DD')).toBe(false);
  });
  test('returns false if the date format is incorrect when using a formatter', () => {
    expect(isValidDate('2020/07/32', 'YYYY-MM-DD')).toBe(false);
  });
  test('returns false if the date is missing time', () => {
    expect(isValidDate('2020-07-30')).toBe(false);
  });
});
