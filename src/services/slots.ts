import axios from 'axios';

import config from '../config';
import { TCNRegion } from '../enums';
import { SlotsRequest, Slot, TCNSlotsResponse } from '../interfaces';
import logger from '../logger';
import { KNOWN_SLOTS_ERROR_CODES, TCNError } from '../utils/errors';

export const retrieveSlots = async (regionId: TCNRegion, query: SlotsRequest): Promise<Slot[]> => {
  const path = `${config.tcn.urls.get(regionId)}/testCentres/${query.testCentreId}/slots?testTypes=${query.testTypes}&dateFrom=${query.dateFrom}&dateTo=${query.dateTo}`;
  logger.log(`SLOTS::retrieveSlots: Sending TCN slots request to ${path}`);

  try {
    const response: TCNSlotsResponse = await axios.get(path);
    return response.data;
  } catch (error) {
    logger.error(error, 'SLOTS::retrieveSlots: TCN get request failed');
    if (KNOWN_SLOTS_ERROR_CODES.includes(error.response?.status)) {
      throw new TCNError(error.response.status, error.response.data?.message);
    } else {
      throw error;
    }
  }
};
