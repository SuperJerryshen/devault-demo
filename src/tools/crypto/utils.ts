export function uint8ArrayToBase64(
  byteArray: Uint8Array<ArrayBuffer | ArrayBufferLike>
): string {
  return btoa(uint8ArrayToString(byteArray));
}
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return uint8ArrayToBase64(byteArray);
}
export function base64ToUint8Array(base64Str: string): Uint8Array<ArrayBuffer> {
  return stringToUint8Array(atob(base64Str));
}
export function base64ToArrayBuffer(base64Str: string): ArrayBuffer {
  const byteArray = base64ToUint8Array(base64Str);
  return byteArray.buffer;
}

export function uint8ArrayToString(
  byteArray: Uint8Array<ArrayBuffer | ArrayBufferLike>
): string {
  let binaryString = "";
  for (let i = 0; i < byteArray.byteLength; i++) {
    binaryString += String.fromCharCode(byteArray[i]);
  }
  return binaryString;
}
export function arrayBufferToString(buffer: ArrayBuffer) {
  return uint8ArrayToString(new Uint8Array(buffer));
}

export function stringToUint8Array(str: string): Uint8Array<ArrayBuffer> {
  const byteArray = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    byteArray[i] = str.charCodeAt(i);
  }
  return byteArray;
}
export function stringToArrayBuffer(str: string): ArrayBuffer {
  const byteArray = stringToUint8Array(str);
  return byteArray.buffer;
}

export function uint8ArrayToHextString(
  byteArray: Uint8Array<ArrayBuffer>
): string {
  return (
    "0x" +
    Array.from(byteArray)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function hexStringToUint8Array(
  hexString: string
): Uint8Array<ArrayBuffer> {
  const cleanedHexString = hexString.startsWith("0x")
    ? hexString.slice(2)
    : hexString;
  const byteArray = new Uint8Array(cleanedHexString.length / 2);
  for (let i = 0; i < cleanedHexString.length; i += 2) {
    byteArray[i / 2] = parseInt(cleanedHexString.substr(i, 2), 16);
  }
  return byteArray;
}

export function arrayBufferToHextString(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return uint8ArrayToHextString(byteArray);
}

export function hexStringToArrayBuffer(hexString: string): ArrayBuffer {
  const byteArray = hexStringToUint8Array(hexString);
  return byteArray.buffer;
}
