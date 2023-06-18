import { CID } from "multiformats/cid";
import * as json from "multiformats/codecs/json";
import { sha256 } from "multiformats/hashes/sha2";

export const createCID = async (address) => {
  const bytes = json.encode({ address });
  const hash = await sha256.digest(bytes);
  const cid = CID.create(1, json.code, hash);
  return cid;
};
