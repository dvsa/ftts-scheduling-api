import { mocked } from 'ts-jest/utils';
import { isValidSlot, removeInvalidSlotsFrom } from '../../../src/utils/slots';
import { listPayload, listOfInvalidSlots, listPayloadWithInvalidSlots } from '../../stubs/tcn';
import { Slot } from '../../../src/interfaces';
import { BusinessTelemetryEvent, logger } from '../../../src/logger';

const loggerMock = mocked(logger, true);

describe('slots', () => {
  afterEach(() => {
    loggerMock.event.mockClear();
  });

  describe('removeInvalidSlotsFrom', () => {
    test('removes the invalid slots from the list', () => {
      expect(removeInvalidSlotsFrom(listPayloadWithInvalidSlots)).toStrictEqual(listPayload);
    });
  });

  describe('isValidSlot', () => {
    test('returns true if the slot is valid', () => {
      expect(isValidSlot(listPayload[0])).toBe(true);
      expect(loggerMock.event).not.toHaveBeenCalled();
    });

    test('returns false if the slot is not valid and logs invalid slot event', () => {
      expect(isValidSlot(listOfInvalidSlots[0])).toBe(false);
      expectCallsSlotEventWith(listOfInvalidSlots[0]);
    });

    test('returns false if the slot is empty and logs invalid slot event', () => {
      expect(isValidSlot({} as Slot)).toBe(false);
      expectCallsSlotEventWith({} as Slot);
    });

    test('returns false if the slot is null and logs invalid slot event', () => {
      expect(isValidSlot(null)).toBe(false);
      expectCallsSlotEventWith(null);
    });

    test('returns false if the slot is undefined and logs invalid slot event', () => {
      expect(isValidSlot(undefined)).toBe(false);
      expectCallsSlotEventWith(undefined);
    });
  });

  const expectCallsSlotEventWith = (invalidSlot: Slot) => {
    expect(loggerMock.event).toHaveBeenCalledWith(BusinessTelemetryEvent.SCHEDULING_SLOT_INVALID_ERROR, 'isValidSlot:: Slot date is not in ISO format', invalidSlot);
  };
});
