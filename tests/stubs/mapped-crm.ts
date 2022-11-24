import { TCNRegion } from '../../src/enums';
import { BehaviouralMarker, BookingProduct } from '../../src/interfaces';

export function mockBookingProducts(): BookingProduct[] {
  return [
    {
      bookingProductId: 'mockBookingProductId',
      bookingId: 'mockBookingId',
      candidateId: 'mockCandidateId',
      reference: 'B-000-063-935-01',
      testDate: '2021-04-02T09:45:00Z',
      tcnSlotDataUpdatedOn: '2021-04-02T09:50:00Z',
      tcnUpdateDate: '2021-04-02T09:45:00Z',
      tcnRegion: TCNRegion.A,
    },
    {
      bookingProductId: 'mockBookingProductId-2',
      bookingId: 'mockBookingId-2',
      candidateId: 'mockDifferentCandidateId',
      reference: 'B-000-063-935-02',
      testDate: '2021-04-02T09:45:00Z',
      tcnSlotDataUpdatedOn: '2021-04-02T09:50:00Z',
      tcnUpdateDate: '2021-04-02T09:45:00Z',
      tcnRegion: TCNRegion.B,
    },
    {
      bookingProductId: 'mockBookingProductId-3',
      bookingId: 'mockBookingId-3',
      candidateId: 'mockDifferentDifferentCandidateId',
      reference: 'B-000-063-935-03',
      testDate: '2021-04-02T09:45:00Z',
      tcnSlotDataUpdatedOn: '2021-04-02T09:50:00Z',
      tcnUpdateDate: '2021-04-02T09:45:00Z',
      tcnRegion: TCNRegion.C,
    },
  ];
}

export function mockBehaviouralMarkers(): BehaviouralMarker[] {
  return [
    {
      behaviouralMarkerId: 'mockBehaviouralMarkerId',
      candidateId: 'mockCandidateId',
      caseId: null,
      description: 'Caught cheating mock',
      removalReason: null,
      removalReasonDetails: '',
      updateReason: 675030004,
      updateReasonDetails: null,
      blockedFromBookingOnline: false,
      startDate: '2021-04-01',
      endDate: '2021-04-23',
    },
    {
      behaviouralMarkerId: 'mockBehaviouralMarkerId',
      candidateId: 'mockCandidateId',
      caseId: null,
      description: 'outdated behaviour mock',
      removalReason: null,
      removalReasonDetails: '',
      updateReason: 675030004,
      updateReasonDetails: null,
      blockedFromBookingOnline: false,
      startDate: '2020-01-01',
      endDate: '2020-01-23',
    },
    {
      behaviouralMarkerId: 'mockBehaviouralMarkerId',
      candidateId: 'mockDifferentCandidateId',
      caseId: null,
      description: 'Different candidate behaviour mock',
      removalReason: null,
      removalReasonDetails: '',
      updateReason: 675030004,
      updateReasonDetails: null,
      blockedFromBookingOnline: false,
      startDate: '2021-04-01',
      endDate: '2021-04-23',
    },
  ];
}
