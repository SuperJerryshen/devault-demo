import {
  decryptBufferSource,
  decryptCryptoKey,
  decryptString,
  encryptString,
} from "../crypto/dek";
import deriveKeyFromSign from "../crypto/deriveKeyFromSign";
import { base64ToArrayBuffer } from "../crypto/utils";
import { DecodedFileVault, FileVault } from "./types";

export default class VaultManager {
  originalFileVault: FileVault;
  decodedFileVault?: DecodedFileVault;

  address?: `0x${string}`;
  dek?: CryptoKey;
  masterKey?: CryptoKey;

  constructor(fileVault: FileVault) {
    this.originalFileVault = fileVault;
  }

  async encryptFileVault(): Promise<FileVault | null> {
    if (!this.masterKey || !this.decodedFileVault) {
      return null;
    }
    const vaultsStr = window.encodeURI(
      JSON.stringify(this.decodedFileVault.vaults)
    );
    const vaults = await encryptString(vaultsStr, this.masterKey);
    const newFileVault: FileVault = {
      headers: this.decodedFileVault.headers,
      vaults,
    };
    return newFileVault;
  }

  async unlock(
    address: `0x${string}`,
    sign: string,
    salt: Uint8Array<ArrayBuffer>
  ) {
    if (!this.originalFileVault) {
      return;
    }
    this.address = address;
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
    this.address = undefined;
  }
}
