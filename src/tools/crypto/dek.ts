import {
  arrayBufferToString,
  base64ToArrayBuffer,
  stringToArrayBuffer,
  uint8ArrayToBase64,
  uint8ArrayToString,
} from "./utils";

/**
 * Generates a Data Encryption Key using the Web Crypto API.
 */
export async function generateNewEncryptionKey(): Promise<CryptoKey> {
  const dek = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  return dek;
}

export async function encryptBufferSource(
  buffer: ArrayBuffer,
  key: CryptoKey
): Promise<Uint8Array> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedDEK = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    buffer
  );
  // Prepend IV to the encrypted DEK for later use in decryption
  const combined = new Uint8Array(iv.byteLength + encryptedDEK.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedDEK), iv.byteLength);
  return combined;
}

export async function decryptBufferSource(
  buffer: ArrayBuffer,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const encryptedDataWithIV = new Uint8Array(buffer);
  const iv = encryptedDataWithIV.slice(0, 12);
  const encryptedData = encryptedDataWithIV.slice(12);
  const encryptedDataBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encryptedData
  );
  return encryptedDataBuffer;
}

export async function encryptCryptoKey(
  encryptionKey: CryptoKey,
  derivedKey: CryptoKey
): Promise<string> {
  const exportedDEK = await window.crypto.subtle.exportKey(
    "raw",
    encryptionKey
  );
  const buffer = await encryptBufferSource(exportedDEK, derivedKey);
  console.log("encryptedDEK", buffer);
  return uint8ArrayToBase64(buffer);
}

export async function decryptCryptoKey(
  encryptedCryptoKeyString: string,
  derivedKey: CryptoKey
): Promise<CryptoKey> {
  let buffer: ArrayBuffer | undefined = base64ToArrayBuffer(
    encryptedCryptoKeyString
  );
  let decryptedBuffer: ArrayBuffer | undefined = await decryptBufferSource(
    buffer,
    derivedKey
  );
  const decryptedKey = await window.crypto.subtle.importKey(
    "raw",
    decryptedBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  // Clear sensitive data from memory
  buffer = undefined;
  decryptedBuffer = undefined;
  return decryptedKey;
}

export async function decryptDEK(
  encryptedDEKWithIV: Uint8Array,
  derivedKey: CryptoKey
): Promise<CryptoKey> {
  let decryptedDEKBuffer = await decryptBufferSource(
    encryptedDEKWithIV.buffer,
    derivedKey
  );
  const decryptedData = await window.crypto.subtle.importKey(
    "raw",
    decryptedDEKBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  // Clear sensitive data from memory
  decryptedDEKBuffer = undefined as unknown as ArrayBuffer;
  return decryptedData;
}

export async function encryptString(str: string, key: CryptoKey) {
  const buffer = stringToArrayBuffer(btoa(str));
  const encryptedArray = await encryptBufferSource(buffer, key);
  const encryptedStr = uint8ArrayToString(encryptedArray);
  return btoa(encryptedStr);
}

export async function decryptString(
  encryptedStr: string,
  key: CryptoKey
): Promise<string> {
  const str = atob(encryptedStr);
  const encryptedArray = stringToArrayBuffer(str);
  const decryptedData = await decryptBufferSource(encryptedArray, key);
  const decryptedStr = arrayBufferToString(decryptedData);
  return atob(decryptedStr);
}
