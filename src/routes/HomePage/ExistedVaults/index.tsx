import VaultManager from "@/tools/vaults/vaultManager";
import signMessage from "@/tools/wallets/walletSign";
import { Button, ButtonGroup } from "@heroui/button";
import { addToast } from "@heroui/react";
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
  const vaultManagerRef = useRef<VaultManager>();
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
                  addToast({ title: "Vault locked", color: "success" });
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
                      addToast({
                        title: "Failed to encrypt vault",
                        color: "danger",
                      });
                      return;
                    }
                    await localforage.setItem<FileVault>(
                      `vaultdata_${address}`,
                      vaultFile
                    );
                    addToast({ title: "Vault saved", color: "success" });
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
                        addToast({
                          title: "Failed to encrypt vault",
                          color: "danger",
                        });
                        return;
                      }

                      // 2. 上传到 IPFS
                      addToast({ title: "Uploading to IPFS...", color: "primary" });
                      const cid = await uploadToIpfs(vaultFile);

                      // 3. 同步 CID 到区块链
                      addToast({ title: "Syncing CID to blockchain...", color: "primary" });
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

                      addToast({
                        title: `IPFS CID: ${cid}`,
                        description: "Successfully saved to IPFS and blockchain",
                        color: "success",
                      });
                      console.log("Transaction hash:", hash);
                    } catch (error) {
                      console.error("Failed to save to IPFS:", error);
                      addToast({
                        title: "Failed to save to IPFS",
                        description: String(error),
                        color: "danger",
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
                addToast({ title: "Failed to sign message", color: "danger" });
                return;
              }
              const salt = base64ToUint8Array(fileVault.headers.ciphers.salt);
              await vaultManager.unlock(address, sign, salt);
              addToast({ title: "Vault unlocked", color: "success" });
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
              addToast({ title: "Fetching CID from blockchain...", color: "primary" });
              const cid = await contract.read.getIpfs({
                account: address,
              });

              if (!cid) {
                addToast({
                  title: "No IPFS CID found",
                  description: "No vault data found on blockchain for this address",
                  color: "warning",
                });
                return;
              }

              console.log("Contract IPFS CID:", cid);

              // 2. 先检查本地缓存
              addToast({ title: "Checking local cache...", color: "primary" });
              const cachedData = await getFromLocalCache<FileVault>(cid);

              let vaultData: FileVault | null = cachedData;
              let fromCache = !!cachedData;

              // 3. 如果缓存没有，从 IPFS 获取
              if (!vaultData) {
                addToast({ title: "Fetching from IPFS...", color: "primary" });
                vaultData = await getFromIpfs<FileVault>(cid);

                if (!vaultData) {
                  addToast({
                    title: "Failed to fetch from IPFS",
                    description: "Could not retrieve vault data from IPFS",
                    color: "danger",
                  });
                  return;
                }

                // 4. 保存到本地缓存
                await saveToLocalCache(cid, vaultData);
                fromCache = false;
              }

              addToast({
                title: "Successfully retrieved vault data",
                description: fromCache ? "Loaded from local cache" : "Loaded from IPFS",
                color: "success",
              });

              console.log("Vault data from IPFS:", vaultData);
              alert(`Vault data retrieved successfully!\nCID: ${cid}\nSource: ${fromCache ? "Local Cache" : "IPFS"}\n\nCheck console for details.`);
            } catch (error) {
              console.error("Failed to get IPFS content:", error);
              addToast({
                title: "Failed to get IPFS content",
                description: String(error),
                color: "danger",
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
