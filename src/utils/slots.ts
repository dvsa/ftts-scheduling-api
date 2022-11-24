import { Slot } from '../interfaces';
import { isValidDate } from './validators';
import { BusinessTelemetryEvent, logger } from '../logger';

export const removeInvalidSlotsFrom = (slotList: Slot[]): Slot[] => slotList.filter(isValidSlot);

export const isValidSlot = (slot: Slot): boolean => {
  if (slot && isValidDate(slot.startDateTime)) {
    return true;
  }
  logger.event(BusinessTelemetryEvent.SCHEDULING_SLOT_INVALID_ERROR, 'isValidSlot:: Slot date is not in ISO format', slot);
  return false;
};
