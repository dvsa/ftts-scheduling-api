import dotenv from 'dotenv';
import { TCNRegion } from '../enums';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV === 'development') {
  const result = dotenv.config();
  if (result.error) {
    // This error should crash whole process
    throw new Error("⚠️  Couldn't find .env file  ⚠️");
  }
}

const useStub = process.env.USE_TCN_STUB === 'true';

const testTypes = new Set();
testTypes.add('CAR');
testTypes.add('MOTORCYCLE');
testTypes.add('LGV_MC');
testTypes.add('LGV_HPT');
testTypes.add('LGV_CPC');
testTypes.add('LGV_CPC_C');
testTypes.add('PCV_MC');
testTypes.add('PCV_HPT');
testTypes.add('PCV_CPC');
testTypes.add('PCV_CPC_C');
testTypes.add('ADI_P1');
testTypes.add('ADI_HPT');
testTypes.add('ERS');
testTypes.add('AMI_P1');
testTypes.add('TAXI');

const TCN_URLS = new Map([
  [TCNRegion.A, useStub ? process.env.TCN_STUB_URL : process.env.TCN_REGION_A_URL],
  [TCNRegion.B, useStub ? process.env.TCN_STUB_URL : process.env.TCN_REGION_B_URL],
  [TCNRegion.C, useStub ? process.env.TCN_STUB_URL : process.env.TCN_REGION_C_URL],
]);

export default {
  tcn: {
    testTypes,
    urls: TCN_URLS,
  },
};
