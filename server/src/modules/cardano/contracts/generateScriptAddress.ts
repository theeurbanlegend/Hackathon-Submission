import * as fs from 'fs';
import { applyParamsToScript, serializePlutusScript } from '@meshsdk/core';
import { CardanoNetwork } from '../../../common/constants';

const blueprint = JSON.parse(
  fs.readFileSync('../ada-split-bills/plutus.json', 'utf8'),
);

export const scriptCbor = applyParamsToScript(
  blueprint.validators[0].compiledCode,
  [],
);

export const scriptAddr = serializePlutusScript(
  { code: scriptCbor, version: 'V3' },
  undefined,
  CardanoNetwork.Testnet,
).address;
