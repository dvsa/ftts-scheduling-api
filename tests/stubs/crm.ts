import { CRMBehaviouralMarker, CRMBookingProduct } from '../../src/interfaces/crm';

export function mockCRMBookingProducts(): CRMBookingProduct[] {
  return [
    {
      ftts_bookingproductid: '1e647008-6944-eb11-a812-000d3a7f128d',
      _ftts_bookingid_value: 'c70d6502-6944-eb11-a812-000d3a7f128d',
      _ftts_candidateid_value: 'c1ca042d-4cc7-ea11-a812-00224801cecd',
      ftts_reference: 'B-000-063-935-01',
      ftts_testdate: '2020-12-24T09:45:00Z',
      ftts_tcnslotdataupdatedon: '2020-12-24T09:55:00Z',
      ftts_tcn_update_date: '2020-12-24T09:45:00Z',
      ftts_bookingid: {
        ftts_testcentre: {
          accountid: '90f3f200-b001-4919-b169-1f1d09a13845',
          parentaccountid: {
            ftts_regiona: true,
            ftts_regionb: false,
            ftts_regionc: false,
          },
        },
      },
    },
    {
      ftts_bookingproductid: '1e647008-6944-eb11-a812-000d3a7f128d',
      _ftts_bookingid_value: 'c70d6502-6944-eb11-a812-000d3a7f128d',
      _ftts_candidateid_value: 'c1ca042d-4cc7-ea11-a812-00224801cecd',
      ftts_reference: 'B-000-063-935-01',
      ftts_testdate: '2020-12-24T09:45:00Z',
      ftts_tcnslotdataupdatedon: '2020-12-24T09:55:00Z',
      ftts_tcn_update_date: '2020-12-24T09:45:00Z',
      ftts_bookingid: {
        ftts_testcentre: {
          accountid: '77ff01c4-16fd-4537-97f3-f1858cd9ea11',
          parentaccountid: {
            ftts_regiona: false,
            ftts_regionb: true,
            ftts_regionc: false,
          },
        },
      },
    },
    {
      ftts_bookingproductid: '1e647008-6944-eb11-a812-000d3a7f128d',
      _ftts_bookingid_value: 'c70d6502-6944-eb11-a812-000d3a7f128d',
      _ftts_candidateid_value: 'c1ca042d-4cc7-ea11-a812-00224801cecd',
      ftts_reference: 'B-000-063-936-01',
      ftts_testdate: '2020-12-24T09:45:00Z',
      ftts_tcnslotdataupdatedon: '2020-12-24T09:55:00Z',
      ftts_tcn_update_date: '2020-12-24T09:45:00Z',
      ftts_bookingid: {
        ftts_testcentre: {
          accountid: '11470a4a-30e5-44c5-bf35-459ffcda36ac',
          parentaccountid: {
            ftts_regiona: false,
            ftts_regionb: false,
            ftts_regionc: true,
          },
        },
      },
    },
  ];
}

export function mockCRMBehaviouralMarkers(): CRMBehaviouralMarker[] {
  return [
    {
      ftts_behaviouralmarkerid: '84a31234-2a99-eb11-b1ac-0022484135ea',
      _ftts_personid_value: 'c1ca042d-4cc7-ea11-a812-00224801cecd',
      _ftts_caseid_value: null,
      ftts_description: 'Caught cheating mock',
      ftts_removalreason: null,
      ftts_removalreasondetails: '',
      ftts_updatereason: 675030004,
      ftts_updatereasondetails: null,
      ftts_blockedfrombookingonline: false,
      ftts_startdate: '2021-04-01',
      ftts_enddate: '2021-04-23',
    },
    {
      ftts_behaviouralmarkerid: '84a31234-2a99-eb11-b1ac-0022484135ea',
      _ftts_personid_value: 'c1ca042d-4cc7-ea11-a812-00224801cecd',
      _ftts_caseid_value: null,
      ftts_description: 'Caught cheating mock',
      ftts_removalreason: null,
      ftts_removalreasondetails: '',
      ftts_updatereason: 675030004,
      ftts_updatereasondetails: null,
      ftts_blockedfrombookingonline: false,
      ftts_startdate: '2021-04-01',
      ftts_enddate: '2021-04-23',
    },
  ];
}
