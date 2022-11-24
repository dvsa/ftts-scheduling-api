import { Config } from '../../../src/config';
import { TCNRegion } from '../../../src/enums';
import { getTCNURL } from '../../../src/utils/url';


const regionAUrl = 'https://region-a.com';
const regionBUrl = 'https://region-b.com';
const regionCUrl = 'https://region-c.com';

jest.mock('../../../src/config', () => ({
  tcn: {
    urls: new Map([
      ['a', regionAUrl],
      ['b', regionBUrl],
      ['c', regionCUrl],
    ]),
  },
} as Config));

describe('getTCNURL', () => {
  test.each([
    [TCNRegion.A, regionAUrl],
    [TCNRegion.B, regionBUrl],
    [TCNRegion.C, regionCUrl],
  ])('returns the correct url for region %s', (region, expectedUrl) => {
    expect(getTCNURL(region)).toBe(expectedUrl);
  });

  test('it should throw an error if the url can not be found', () => {
    expect(() => getTCNURL('fake' as TCNRegion)).toThrow(new Error('Unable to get url based on provided regionId: fake'));
  });
});
