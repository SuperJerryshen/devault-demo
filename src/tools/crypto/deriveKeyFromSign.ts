/**
 * Derive a CryptoKey from a sign string using PBKDF2 and AES-GCM.
 * @param sign - The sign string to derive the key from.
 * @returns
 */
async function deriveKeyFromSign(sign: string, salt?: Uint8Array<ArrayBuffer>) {
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sign),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  // Generate a 256bit random salt
  const saltBytes = salt || window.crypto.getRandomValues(new Uint8Array(32));
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes,
      iterations: 100000,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return {
    derivedKey,
    salt: saltBytes,
  };
}

export default deriveKeyFromSign;
