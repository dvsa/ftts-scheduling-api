export interface CRMBookingProduct {
  ftts_bookingproductid: string;
  _ftts_bookingid_value: string;
  _ftts_candidateid_value?: string;
  ftts_reference: string;
  ftts_testdate?: string;
  ftts_tcnslotdataupdatedon?: string;
  ftts_tcn_update_date?: string;
  ftts_bookingid: {
    ftts_testcentre: CRMTestCentre;
  };
}

export interface CRMTestCentre {
  accountid: string;
  parentaccountid: {
    ftts_regiona?: boolean;
    ftts_regionb?: boolean;
    ftts_regionc?: boolean;
  };
}

export interface CRMBehaviouralMarker {
  ftts_behaviouralmarkerid: string;
  _ftts_personid_value: string;
  _ftts_caseid_value?: string;
  ftts_description?: string;
  ftts_removalreason?: number;
  ftts_removalreasondetails?: string;
  ftts_updatereason?: number;
  ftts_updatereasondetails?: string;
  ftts_blockedfrombookingonline?: boolean;
  ftts_startdate?: string;
  ftts_enddate?: string;
}

export interface CRMBatchMarkerResponse {
  value: CRMBehaviouralMarker[];
}
