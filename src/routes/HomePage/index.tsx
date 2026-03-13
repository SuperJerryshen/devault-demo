import { addToast, Button, Spinner } from "@heroui/react";
import signMessage from "../../tools/wallets/walletSign";
import walletClient from "../../tools/wallets/walletClient";
import publicClient from "../../tools/wallets/publicClient";
import deriveKeyFromSign from "../../tools/crypto/deriveKeyFromSign";
import generateNewVault from "../../tools/vaults/generateNewVault";
import ExistedVaults from "./ExistedVaults";
import { useEffect, useMemo, useState } from "react";
import localforage from "localforage";
import { FileVault } from "@/tools/vaults/types";
import contract from "../../tools/wallets/storageContract";
import { getFromIpfs, saveToLocalCache, getFromLocalCache } from "../../tools/ipfs";

export default function HomePage() {
  const [addresses, setAddresses] = useState<`0x${string}`[]>([]);
  const [vaultData, setVaultData] = useState<FileVault>();
  const [loading, setLoading] = useState(false);
  const [checkingChain, setCheckingChain] = useState(true);

  const currentVault = useMemo(() => {
    if (addresses.length === 0) {
      return null;
    }
    return vaultData || null;
  }, [addresses, vaultData]);

  /**
   * 检查链上 CID 并验证有效性
   */
  const checkChainForCID = async (address: `0x${string}`) => {
    try {
      console.log("Checking chain for CID...", address);
      // 1. 从链上获取 CID
      const cid = await contract.read.getIpfs({
        account: address,
      });

      console.log("Chain CID:", cid);

      if (!cid || cid === "") {
        console.log("No CID found on chain");
        return null;
      }

      // 2. 先检查本地缓存
      const cachedData = await getFromLocalCache<FileVault>(cid);
      if (cachedData) {
        console.log("Found vault data in local cache");
        return cachedData;
      }

      // 3. 从 IPFS 获取
      console.log("Fetching from IPFS...");
      const ipfsData = await getFromIpfs<FileVault>(cid);
      
      if (!ipfsData) {
        console.log("Failed to fetch from IPFS");
        return null;
      }

      // 4. 验证数据格式
      if (!ipfsData.headers || !ipfsData.vaults) {
        console.log("Invalid vault data format");
        return null;
      }

      // 5. 保存到本地缓存
      await saveToLocalCache(cid, ipfsData);
      console.log("Successfully fetched and cached vault data from IPFS");
      
      return ipfsData;
    } catch (error) {
      console.error("Error checking chain for CID:", error);
      return null;
    }
  };

  useEffect(() => {
    async function fetchAddresses() {
      const addrs = await walletClient.getAddresses();
      setAddresses(addrs);
      if (addrs.length === 0) {
        setCheckingChain(false);
        return;
      }
      
      // 先尝试从本地加载
      const localVault = await localforage.getItem<FileVault>(
        `vaultdata_${addrs[0]}`
      );
      
      if (localVault) {
        console.log("Found local vault data");
        setVaultData(localVault);
        setCheckingChain(false);
        return;
      }

      // 本地没有，检查链上 CID
      const chainVault = await checkChainForCID(addrs[0]);
      if (chainVault) {
        console.log("Found vault data from chain/IPFS");
        setVaultData(chainVault);
      }
      
      setCheckingChain(false);
    }
    fetchAddresses();
  }, []);

  if (addresses.length === 0) {
    return (
      <div>
        <Button
          onPress={async () => {
            try {
              const addresses = await walletClient.requestAddresses();
              setAddresses(addresses);
              setCheckingChain(true);
              
              // 检查链上 CID
              const chainVault = await checkChainForCID(addresses[0]);
              if (chainVault) {
                setVaultData(chainVault);
                addToast({
                  title: "Vault restored from IPFS",
                  color: "success",
                });
              }
            } catch (error) {
              addToast({ title: "Failed to connect wallet", color: "danger" });
            } finally {
              setCheckingChain(false);
            }
          }}
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  // 检查链上 CID 时显示 Loading
  if (checkingChain) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Spinner size="lg" label="Checking blockchain for vault data..." />
        <p className="mt-4 text-sm text-gray-500">
          Fetching CID from smart contract and IPFS...
        </p>
      </div>
    );
  }

  return (
    <div>
      {currentVault ? (
        <ExistedVaults address={addresses[0]} vaultData={vaultData} />
      ) : (
        <div>
          <Button
            isLoading={loading}
            onPress={async () => {
              try {
                setLoading(true);
                let sign: `0x${string}` | undefined;
                try {
                  sign = await signMessage();
                } catch (error) {}
                if (!sign) {
                  addToast({
                    title: "Failed to sign message",
                    color: "danger",
                  });
                  return;
                }
                const address = addresses[0];
                const result = await publicClient.verifyTypedData({
                  domain: {
                    name: "Devault",
                    chainId: BigInt(walletClient.chain.id),
                  },
                  types: {
                    EIP712Domain: [
                      { name: "name", type: "string" },
                      { name: "chainId", type: "uint256" },
                    ],
                    VaultAuth: [
                      { name: "purpose", type: "string" },
                      { name: "tips", type: "string" },
                    ],
                  },
                  primaryType: "VaultAuth",
                  message: {
                    purpose: "Vault Access",
                    tips: "Sign this message to access your vault securely.",
                  },
                  signature: sign,
                  address,
                });
                if (!result) {
                  addToast({
                    title: "Failed to verify signature",
                    color: "danger",
                  });
                  return;
                }
                const { derivedKey, salt } = await deriveKeyFromSign(sign);
                const vaultData = await generateNewVault(
                  derivedKey,
                  salt,
                  walletClient.chain
                );
                const vaultFile = JSON.parse(JSON.stringify(vaultData[0]));
                localforage.setItem<FileVault>(
                  `vaultdata_${address}`,
                  vaultFile
                );
                setVaultData(vaultFile);
                addToast({ title: "New vault generated", color: "success" });
              } catch (error) {
                addToast({
                  title: "Failed to generate new vault",
                  color: "danger",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            Generate New Vault
          </Button>
        </div>
      )}
    </div>
  );
}
