import { TreeItem } from "react-complex-tree";
import type { Chain } from "viem";

export interface CiphersMap {
  /**
   * Base64 encoded salt used for key derivation.
   */
  salt: string;
  master: {
    /**
     * Base64 encoded cipher text of the encrypted master key.
     */
    cipher: string;
  };
  dek: {
    /**
     * Base64 encoded cipher text of the encrypted data encryption key (DEK).
     */
    cipher: string;
  };
}

export interface FileVault {
  headers: {
    version: number;
    ciphers: CiphersMap;
    chain: Chain;
  };
  vaults: string;
}
export interface DecodedFileVault {
  headers: {
    version: number;
    ciphers: CiphersMap;
    chain: Chain;
  };
  vaults: VaultsDataType;
}

export type VaultsDataType = Record<string, VaultItemOrigin>;

export type VaultItemOrigin<T = any> = TreeItem<string> & {
  createdAt: string;
  updatedAt: string;
  vaultData: T;
};

export type EncodedVaultItem = VaultItemOrigin<string>;

export type DecodedVaultItemForBaseAccount = VaultItemOrigin<BaseAccountData>;

export type DecodedVaultItemForWebSiteAccount =
  VaultItemOrigin<WebSiteAccountData>;

export interface WebSiteAccountData {
  url: string;
  username: string;
  password: string;
  notes?: string;
}
export interface BaseAccountData {
  username: string;
  password: string;
  notes?: string;
}
