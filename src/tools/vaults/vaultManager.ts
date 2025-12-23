import {
  decryptBufferSource,
  decryptCryptoKey,
  decryptString,
} from "../crypto/dek";
import deriveKeyFromSign from "../crypto/deriveKeyFromSign";
import { base64ToArrayBuffer } from "../crypto/utils";
import { DecodedFileVault, FileVault } from "./types";

export default class VaultManager {
  originalFileVault: FileVault;
  decodedFileVault?: DecodedFileVault;

  dek?: CryptoKey;
  masterKey?: CryptoKey;

  constructor(fileVault: FileVault) {
    this.originalFileVault = fileVault;
  }

  async unlock(sign: string, salt: Uint8Array<ArrayBuffer>) {
    if (!this.originalFileVault) {
      return;
    }
    const { derivedKey } = await deriveKeyFromSign(sign, salt);
    this.dek = await decryptCryptoKey(
      this.originalFileVault.headers.ciphers.dek.cipher,
      derivedKey
    );
    this.masterKey = await decryptCryptoKey(
      this.originalFileVault.headers.ciphers.master.cipher,
      derivedKey
    );

    const decodedVaultBuffer = await decryptString(
      this.originalFileVault.vaults,
      this.masterKey
    );
    this.decodedFileVault = {
      headers: this.originalFileVault.headers,
      vaults: JSON.parse(decodeURI(decodedVaultBuffer)),
    };
  }

  async lock() {
    this.dek = undefined;
    this.masterKey = undefined;
    this.decodedFileVault = undefined;
  }
}
