import VaultManager from "@/tools/vaults/vaultManager";
import signMessage from "@/tools/wallets/walletSign";
import { Button, ButtonGroup, toast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { FileVault, VaultsDataType } from "@/tools/vaults/types";
import { base64ToUint8Array } from "@/tools/crypto/utils";
import VaultLists from "./VaultLists";
import localforage from "localforage";
import contract from "@/tools/wallets/storageContract";
import { uploadToIpfs, getFromIpfs, saveToLocalCache, getFromLocalCache } from "@/tools/ipfs";

export default function ExistedVaults(props: {
  address?: `0x${string}`;
  vaultData?: FileVault;
}) {
  const { address, vaultData } = props;
  const vaultManagerRef = useRef<VaultManager>(undefined);
  const [vaultLists, setVaultLists] = useState<VaultsDataType>();

  useEffect(() => {}, [vaultLists]);

  if (!address) {
    return <div>No address found</div>;
  }

  return (
    <div>
      <div>Existed Vault</div>
      <div key={address}>
        <div>Address:</div>
        <div>{address}</div>
        {vaultLists ? (
          <div>
            <ButtonGroup>
              <Button
                onPress={async () => {
                  await vaultManagerRef.current?.lock();
                  vaultManagerRef.current = undefined;
                  setVaultLists(undefined);
                  toast.success("Vault locked");
                }}
              >
                Lock Vault
              </Button>
              <Button
                onPress={async () => {
                  const vaultManager = vaultManagerRef.current;
                  if (vaultManager && vaultManager.decodedFileVault) {
                    const vaultFile = await vaultManager.encryptFileVault();
                    if (!vaultFile) {
                      toast.danger("Failed to encrypt vault");
                      return;
                    }
                    await localforage.setItem<FileVault>(
                      `vaultdata_${address}`,
                      vaultFile
                    );
                    toast.success("Vault saved");
                  }
                }}
              >
                Save Vault
              </Button>
              <Button
                onPress={async () => {
                  const result = await contract.read.getIpfs({
                    account: address,
                  });
                  console.log("Contract IPFS:", result);
                }}
              >
                Contract
              </Button>
              <Button
                onPress={async () => {
                  const vaultManager = vaultManagerRef.current;
                  if (vaultManager && vaultManager.decodedFileVault) {
                    try {
                      // 1. 加密 Vault
                      const vaultFile = await vaultManager.encryptFileVault();
                      if (!vaultFile) {
                        toast.danger("Failed to encrypt vault");
                        return;
                      }

                      // 2. 上传到 IPFS
                      toast.info("Uploading to IPFS...");
                      const cid = await uploadToIpfs(vaultFile);

                      // 3. 同步 CID 到区块链
                      toast.info("Syncing CID to blockchain...");
                      const hash = await contract.write.setIpfs([cid], {
                        account: address,
                      });

                      // 4. 保存到本地缓存
                      await saveToLocalCache(cid, vaultFile);

                      // 5. 同时保存一份到本地（兼容旧的存储方式）
                      await localforage.setItem<FileVault>(
                        `vaultdata_${address}`,
                        vaultFile
                      );

                      toast.success(`IPFS CID: ${cid}`, {
                        description: "Successfully saved to IPFS and blockchain",
                      });
                      console.log("Transaction hash:", hash);
                    } catch (error) {
                      console.error("Failed to save to IPFS:", error);
                      toast.danger("Failed to save to IPFS", {
                        description: String(error),
                      });
                    }
                  }
                }}
              >
                Contract set ipfs storage
              </Button>
            </ButtonGroup>
            <VaultLists
              list={vaultLists}
              vaultManagerRef={vaultManagerRef}
              onChange={(vals) => {
                setVaultLists(vals);
                const vaultManager = vaultManagerRef.current;
                if (vaultManager && vaultManager.decodedFileVault) {
                  vaultManager.decodedFileVault.vaults = vals;
                }
              }}
            />
          </div>
        ) : (
          <Button
            onPress={async () => {
              const fileVault = vaultData;
              if (!fileVault) {
                return;
              }
              const vaultManager = new VaultManager(fileVault);
              const sign = await signMessage();
              if (!sign) {
                toast.danger("Failed to sign message");
                return;
              }
              const salt = base64ToUint8Array(fileVault.headers.ciphers.salt);
              await vaultManager.unlock(address, sign, salt);
              toast.success("Vault unlocked");
              setVaultLists(vaultManager.decodedFileVault?.vaults);
              vaultManagerRef.current = vaultManager;
            }}
          >
            Unlock Vault
          </Button>
        )}
        <Button
          onPress={async () => {
            try {
              // 1. 从智能合约获取 CID
              toast.info("Fetching CID from blockchain...");
              const cid = await contract.read.getIpfs({
                account: address,
              });

              if (!cid) {
                toast.warning("No IPFS CID found", {
                  description: "No vault data found on blockchain for this address",
                });
                return;
              }

              console.log("Contract IPFS CID:", cid);

              // 2. 先检查本地缓存
              toast.info("Checking local cache...");
              const cachedData = await getFromLocalCache<FileVault>(cid);

              let vaultData: FileVault | null = cachedData;
              let fromCache = !!cachedData;

              // 3. 如果缓存没有，从 IPFS 获取
              if (!vaultData) {
                toast.info("Fetching from IPFS...");
                vaultData = await getFromIpfs<FileVault>(cid);

                if (!vaultData) {
                  toast.danger("Failed to fetch from IPFS", {
                    description: "Could not retrieve vault data from IPFS",
                  });
                  return;
                }

                // 4. 保存到本地缓存
                await saveToLocalCache(cid, vaultData);
                fromCache = false;
              }

              toast.success("Successfully retrieved vault data", {
                description: fromCache ? "Loaded from local cache" : "Loaded from IPFS",
              });

              console.log("Vault data from IPFS:", vaultData);
              alert(`Vault data retrieved successfully!\nCID: ${cid}\nSource: ${fromCache ? "Local Cache" : "IPFS"}\n\nCheck console for details.`);
            } catch (error) {
              console.error("Failed to get IPFS content:", error);
              toast.danger("Failed to get IPFS content", {
                description: String(error),
              });
            }
          }}
        >
          Get IPFS Content
        </Button>
      </div>
    </div>
  );
}
