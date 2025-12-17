import type { Chain } from "viem";
import type { DecodedFileVault, FileVault } from "./types";
import {
  decryptCryptoKey,
  decryptString,
  encryptCryptoKey,
  encryptString,
  generateNewEncryptionKey,
} from "../crypto/dek";
import { uint8ArrayToBase64 } from "../crypto/utils";

const getDefaultVaults = (): DecodedFileVault["vaults"] => {
  return {
    root: {
      id: "root",
      name: "root",
      isFolder: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
      data: null,
    },
  };
};

export default async function generateNewVault(
  derivedKey: CryptoKey,
  salt: Uint8Array,
  chain: Chain
): Promise<[FileVault, DecodedFileVault]> {
  const dek = await generateNewEncryptionKey();
  const dekCipher = await encryptCryptoKey(dek, derivedKey);
  const asdasd = await decryptCryptoKey(dekCipher, derivedKey);
  console.log("asdasd", asdasd);
  const masterKey = await generateNewEncryptionKey();
  const mkCipher = await encryptCryptoKey(masterKey, derivedKey);

  const originalVaults: DecodedFileVault["vaults"] = getDefaultVaults();
  const vaultsStr = window.encodeURI(JSON.stringify(originalVaults));
  const vaults = await encryptString(vaultsStr, masterKey);
  const headers: DecodedFileVault["headers"] = {
    version: 1,
    ciphers: {
      salt: uint8ArrayToBase64(salt),
      master: {
        cipher: mkCipher,
      },
      dek: {
        cipher: dekCipher,
      },
    },
    chain,
  };
  const originalFileVault: FileVault = {
    headers,
    vaults,
  };
  const decodedFileVault: DecodedFileVault = {
    headers,
    vaults: originalVaults,
  };
  return [originalFileVault, decodedFileVault];
}
