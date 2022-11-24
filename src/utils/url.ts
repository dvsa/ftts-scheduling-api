import config from '../config';
import { TCNRegion } from '../enums';

export const getTCNURL = (regionId: TCNRegion): string => {
  const url = config.tcn.urls.get(regionId);
  if (!url) {
    throw new Error(`Unable to get url based on provided regionId: ${regionId}`);
  }
  return url;
};
