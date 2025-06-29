import * as fs from 'fs';
import * as path from 'path';
import { applyParamsToScript, serializePlutusScript } from '@meshsdk/core';
import { CardanoNetwork } from 'src/common/constants';

console.log(process.cwd());
const blueprint = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'src/modules/cardano/contracts', 'plutus.json'),
    'utf-8',
  ),
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
