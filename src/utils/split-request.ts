import dayjs from 'dayjs';
import { SlotsRequest } from '../interfaces';

const ISO_DATE = 'YYYY-MM-DD';

/**
 * Split a SlotsRequest into multiple requests each up to one week long.
 * Iterates week by week until the original dateTo is reached.
 * Doesn't overlap date ranges - so dateFrom of each request will be dateTo+1day of the previous.
 */
export const splitIntoWeekLongRequests = (request: SlotsRequest): SlotsRequest[] => {
  const { dateFrom, dateTo } = request;

  const requests = [];
  let weekStart = dateFrom;
  let weekEnd;
  do {
    weekEnd = dayjs(weekStart).add(1, 'week').format(ISO_DATE);
    requests.push({
      ...request,
      dateFrom: weekStart === dateFrom ? dateFrom : dayjs(weekStart).add(1, 'day').format(ISO_DATE),
      dateTo: weekEnd > dateTo ? dateTo : weekEnd,
    });
    weekStart = weekEnd;
  } while (weekEnd < dateTo);

  return requests;
};
