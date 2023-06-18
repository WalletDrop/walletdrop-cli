import fs from "fs";
import path from "path";
import { keys } from "@libp2p/crypto";
import { createFromPrivKey } from "@libp2p/peer-id-factory";

const __dirname = path.resolve();

export const createKeys = async (walletAddress) => {
  try {
    const keyPair = await keys.generateKeyPair("Ed25519", 256);
    const peerId = await createFromPrivKey(keyPair);
    const exportedKeyPair = await keyPair.export("");
    const keyJson = {
      peerId,
      key: exportedKeyPair,
      walletAddress,
    };
    keyJson.peerId = peerId.toString();
    fs.writeFileSync(
      path.join(__dirname, "keypair.json"),
      JSON.stringify(keyJson)
    );
    return { peerId, key: keyPair, walletAddress };
  } catch (e) {
    return null;
  }
};
export const getKeys = async () => {
  try {
    const keyPairJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "keypair.json"), "utf-8")
    );
    const keyPair = await keys.importKey(keyPairJson.key, "");
    const peerId = await createFromPrivKey(keyPair);
    return { peerId, key: keyPair, address: keyPairJson.walletAddress };
  } catch (e) {
    return null;
  }
};

export const deleteKeys = async () => {
  try {
    await fs.unlinkSync(path.join(__dirname, "keypair.json"));
  } catch (e) {
    throw new Error(e);
  }
};
