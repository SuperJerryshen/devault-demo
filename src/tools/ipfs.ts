import { PinataSDK, uploadJson, getCid } from "pinata";
import localforage from "localforage";

const IPFS_CACHE_PREFIX = "ipfs_cache_";

// 从环境变量获取 Pinata JWT
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || "";
let pinata: PinataSDK | null = null;

/**
 * 获取 Pinata 实例（单例模式）
 */
function getPinata() {
  if (!pinata) {
    if (!PINATA_JWT) {
      console.warn("Pinata JWT not set, IPFS features will not work");
    }
    pinata = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });
  }
  return pinata;
}

/**
 * 上传数据到 IPFS（通过 Pinata）
 * @param data 要上传的数据（对象）
 * @returns CID 字符串
 */
export async function uploadToIpfs(data: unknown): Promise<string> {
  const pinata = getPinata();
  
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured. Please set VITE_PINATA_JWT in your .env file");
  }

  // 使用 uploadJson 上传 JSON 数据
  const upload = await uploadJson(
    pinata.config,
    data as Record<string, any>,
    "public",
    {}
  );
  
  const cid = upload.cid;
  console.log(`Uploaded to Pinata: ${cid}`);
  
  // Pinata 会自动 pin 住上传的文件，无需额外操作
  return cid;
}

/**
 * 从 IPFS 获取数据（通过 Pinata 网关）
 * @param cid IPFS CID 字符串
 * @returns 数据对象，如果获取失败返回 null
 */
export async function getFromIpfs<T>(cid: string): Promise<T | null> {
  const pinata = getPinata();
  
  if (!PINATA_JWT) {
    // 如果没有配置 Pinata，尝试使用公共网关
    console.warn("Pinata not configured, using public gateway");
    return await getFromPublicGateway(cid);
  }

  try {
    // 使用 Pinata 网关获取数据
    const response = await getCid(pinata.config, cid, "ipfs");
    const data = response.data as T;
    console.log(`Successfully fetched from Pinata gateway: ${cid}`, data);
    return data;
  } catch (error) {
    console.warn("Pinata gateway failed, trying public gateways:", error);
    // Pinata 网关失败，尝试公共网关
    return await getFromPublicGateway(cid);
  }
}

/**
 * 从公共 IPFS 网关获取数据（备用方案）
 */
async function getFromPublicGateway(cid: string): Promise<any | null> {
  const gateways = [
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/",
  ];

  for (const gateway of gateways) {
    try {
      const url = `${gateway}${cid}`;
      console.log(`Trying public gateway: ${url}`);
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log(`Successfully fetched from public gateway: ${gateway}`);
      return data;
    } catch (error) {
      console.warn(`Public gateway ${gateway} failed:`, error);
      continue;
    }
  }

  console.error("All public gateways failed");
  return null;
}

/**
 * 保存数据到本地缓存
 * @param cid IPFS CID
 * @param data 要缓存的数据
 */
export async function saveToLocalCache(cid: string, data: unknown): Promise<void> {
  await localforage.setItem(`${IPFS_CACHE_PREFIX}${cid}`, data);
}

/**
 * 从本地缓存获取数据
 * @param cid IPFS CID
 * @returns 缓存的数据，如果不存在返回 null
 */
export async function getFromLocalCache<T>(cid: string): Promise<T | null> {
  const data = await localforage.getItem<T>(`${IPFS_CACHE_PREFIX}${cid}`);
  return data;
}
