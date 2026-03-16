import VaultManager from "@/tools/vaults/vaultManager";
import signMessage from "@/tools/wallets/walletSign";
import { Button, Card, Chip, toast, Separator } from "@heroui/react";
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
          <FolderIcon className="w-16 h-16 text-default-300" />
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
        <Card.Content className="pt-6">
          {vaultLists ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Chip color="success" size="md" variant="soft">
                  <LockOpenIcon className="w-3.5 h-3.5" />
                  <Chip.Label>Unlocked</Chip.Label>
                </Chip>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 gap-2"
                    onPress={async () => {
                      await vaultManagerRef.current?.lock();
                      vaultManagerRef.current = undefined;
                      setVaultLists(undefined);
                      toast.success("Vault locked");
                    }}
                  >
                    <LockClosedIcon className="w-4 h-4" />
                    Lock
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 gap-2"
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
                    Save Local
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 gap-2"
                    onPress={async () => {
                      const vaultManager = vaultManagerRef.current;
                      if (vaultManager && vaultManager.decodedFileVault) {
                        try {
                          const vaultFile = await vaultManager.encryptFileVault();
                          if (!vaultFile) {
                            toast.danger("Failed to encrypt vault");
                            return;
                          }
                          toast.info("Uploading to IPFS...");
                          const cid = await uploadToIpfs(vaultFile);
                          toast.info("Syncing CID...");
                          const hash = await contract.write.setIpfs([cid], {
                            account: address,
                          });
                          await saveToLocalCache(cid, vaultFile);
                          await localforage.setItem<FileVault>(
                            `vaultdata_${address}`,
                            vaultFile,
                          );
                          toast.success(`IPFS CID: ${cid}`);
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
                    Backup
                  </Button>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between gap-3 bg-default-50/80 p-3 rounded-lg border border-default-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-default-100 rounded-md">
                    <CloudArrowDownIcon className="w-4 h-4 text-default-600" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Restore from Backup</div>
                    <div className="text-xs text-default-500">
                      Retrieve vault from IPFS
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onPress={async () => {
                    try {
                      toast.info("Fetching CID...");
                      const cid = await contract.read.getIpfs({
                        account: address,
                      });
                      if (!cid) {
                        toast.warning("No CID found");
                        return;
                      }
                      console.log("Contract IPFS CID:", cid);
                      toast.info("Checking cache...");
                      const cachedData = await getFromLocalCache<FileVault>(cid);
                      let vaultData: FileVault | null = cachedData;
                      let fromCache = !!cachedData;
                      if (!vaultData) {
                        toast.info("Fetching from IPFS...");
                        vaultData = await getFromIpfs<FileVault>(cid);
                        if (!vaultData) {
                          toast.danger("Failed to fetch from IPFS");
                          return;
                        }
                        await saveToLocalCache(cid, vaultData);
                        fromCache = false;
                      }
                      toast.success(`Loaded from ${fromCache ? "cache" : "IPFS"}`);
                      console.log("Vault data from IPFS:", vaultData);
                    } catch (error) {
                      console.error("Failed to get IPFS content:", error);
                      toast.danger("Failed to restore", {
                        description: String(error),
                      });
                    }
                  }}
                >
                  Restore
                </Button>
              </div>

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
              <Card.Content className="py-10 flex flex-col items-center gap-5">
                <div className="p-4 bg-background rounded-2xl border border-default-200 shadow-sm">
                  <LockClosedIcon className="w-10 h-10 text-default-400" />
                </div>
                <div className="text-center space-y-1.5">
                  <div className="text-lg font-semibold">Vault is Locked</div>
                  <div className="text-sm text-default-500 max-w-sm">
                    Unlock with your wallet signature to access credentials
                  </div>
                </div>
                <Button
                  size="lg"
                  variant="primary"
                  className="h-11 px-6 gap-2"
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
        </Card.Content>
      </Card>
    </div>
  );
}
