import VaultManager from "@/tools/vaults/vaultManager";
import signMessage from "@/tools/wallets/walletSign";
import { Button, Card, Chip, toast, Badge, Separator } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { FileVault, VaultsDataType } from "@/tools/vaults/types";
import { base64ToUint8Array } from "@/tools/crypto/utils";
import VaultLists from "./VaultLists";
import localforage from "localforage";
import contract from "@/tools/wallets/storageContract";
import {
  uploadToIpfs,
  getFromIpfs,
  saveToLocalCache,
  getFromLocalCache,
} from "@/tools/ipfs";
import {
  LockClosedIcon,
  LockOpenIcon,
  FolderIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  KeyIcon,
  WalletIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

export default function ExistedVaults(props: {
  address?: `0x${string}`;
  vaultData?: FileVault;
}) {
  const { address, vaultData } = props;
  const vaultManagerRef = useRef<VaultManager>(undefined);
  const [vaultLists, setVaultLists] = useState<VaultsDataType>();

  useEffect(() => {}, [vaultLists]);

  if (!address) {
    return (
      <Card className="p-12 text-center">
        <Card.Content className="flex flex-col items-center gap-4">
          <WalletIcon className="w-16 h-16 text-default-300" />
          <div className="text-xl font-semibold text-default-500">
            No Wallet Connected
          </div>
          <div className="text-sm text-default-400">
            Please connect your wallet to access your vault
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <Card.Header className="bg-gradient-to-r from-primary/10 to-transparent pb-6">
          <Card.Title>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <FolderIcon className="w-7 h-7 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold">Password Vault</div>
                <div className="text-sm text-default-500">
                  Manage your secure credentials
                </div>
              </div>
            </div>
          </Card.Title>
        </Card.Header>
        <Card.Content className="space-y-6 pt-6">
          <div className="flex flex-col gap-2 bg-default-50 p-4 rounded-xl border border-default-100">
            <div className="flex items-center gap-2 text-sm text-default-500">
              <KeyIcon className="w-4 h-4" />
              Wallet Address
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-sm bg-background px-4 py-2 rounded-lg border border-default-200 break-all flex-1">
                {address}
              </div>
              <Badge variant="soft">Connected</Badge>
            </div>
          </div>

          {vaultLists ? (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Chip color="success" size="lg">
                  <LockOpenIcon className="w-4 h-4" />
                  <Chip.Label>Vault Unlocked</Chip.Label>
                </Chip>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  className="h-12 justify-start gap-3"
                  onPress={async () => {
                    await vaultManagerRef.current?.lock();
                    vaultManagerRef.current = undefined;
                    setVaultLists(undefined);
                    toast.success("Vault locked");
                  }}
                >
                  <LockClosedIcon className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <div className="font-semibold">Lock Vault</div>
                    <div className="text-xs text-default-500">
                      Secure your credentials
                    </div>
                  </div>
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 justify-start gap-3"
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
                        vaultFile,
                      );
                      toast.success("Vault saved");
                    }
                  }}
                >
                  <ComputerDesktopIcon className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <div className="font-semibold">Save Local</div>
                    <div className="text-xs text-default-500">
                      Store on this device
                    </div>
                  </div>
                </Button>
                <Button
                  variant="primary"
                  className="h-12 justify-start gap-3"
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
                          vaultFile,
                        );

                        toast.success(`IPFS CID: ${cid}`, {
                          description:
                            "Successfully saved to IPFS and blockchain",
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
                  <CloudArrowUpIcon className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <div className="font-semibold">Backup to IPFS</div>
                    <div className="text-xs text-default-500">
                      Encrypted cloud backup
                    </div>
                  </div>
                </Button>
                <Button
                  variant="tertiary"
                  className="h-12 justify-start gap-3"
                  onPress={async () => {
                    const result = await contract.read.getIpfs({
                      account: address,
                    });
                    console.log("Contract IPFS:", result);
                  }}
                >
                  <div className="flex flex-col items-start">
                    <div className="font-semibold">Check Contract</div>
                    <div className="text-xs text-default-500">
                      View on-chain data
                    </div>
                  </div>
                </Button>
              </div>

              <Separator className="my-2" />

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
            <Card className="border border-dashed border-default-200 bg-default-50/50">
              <Card.Content className="py-12 flex flex-col items-center gap-6">
                <div className="p-5 bg-background rounded-2xl border border-default-200 shadow-sm">
                  <LockClosedIcon className="w-12 h-12 text-default-400" />
                </div>
                <div className="text-center space-y-2">
                  <div className="text-xl font-semibold">Vault is Locked</div>
                  <div className="text-sm text-default-500 max-w-sm">
                    Unlock your vault with your wallet signature to access your
                    saved credentials
                  </div>
                </div>
                <Button
                  size="lg"
                  variant="primary"
                  className="h-14 px-8 text-base gap-3"
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
                    const salt = base64ToUint8Array(
                      fileVault.headers.ciphers.salt,
                    );
                    await vaultManager.unlock(address, sign, salt);
                    toast.success("Vault unlocked");
                    setVaultLists(vaultManager.decodedFileVault?.vaults);
                    vaultManagerRef.current = vaultManager;
                  }}
                >
                  <LockOpenIcon className="w-5 h-5" />
                  Unlock Vault
                </Button>
              </Card.Content>
            </Card>
          )}

          <Separator className="my-2" />

          <div className="bg-default-50 p-4 rounded-xl border border-default-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-default-100 rounded-lg">
                  <CloudArrowDownIcon className="w-5 h-5 text-default-600" />
                </div>
                <div className="space-y-1">
                  <div className="font-medium">Restore from Backup</div>
                  <div className="text-sm text-default-500">
                    Retrieve your vault from IPFS using on-chain data
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="md"
                onPress={async () => {
                  try {
                    // 1. 从智能合约获取 CID
                    toast.info("Fetching CID from blockchain...");
                    const cid = await contract.read.getIpfs({
                      account: address,
                    });

                    if (!cid) {
                      toast.warning("No IPFS CID found", {
                        description:
                          "No vault data found on blockchain for this address",
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
                          description:
                            "Could not retrieve vault data from IPFS",
                        });
                        return;
                      }

                      // 4. 保存到本地缓存
                      await saveToLocalCache(cid, vaultData);
                      fromCache = false;
                    }

                    toast.success("Successfully retrieved vault data", {
                      description: fromCache
                        ? "Loaded from local cache"
                        : "Loaded from IPFS",
                    });

                    console.log("Vault data from IPFS:", vaultData);
                    alert(
                      `Vault data retrieved successfully!\nCID: ${cid}\nSource: ${fromCache ? "Local Cache" : "IPFS"}\n\nCheck console for details.`,
                    );
                  } catch (error) {
                    console.error("Failed to get IPFS content:", error);
                    toast.danger("Failed to get IPFS content", {
                      description: String(error),
                    });
                  }
                }}
              >
                Restore Backup
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
