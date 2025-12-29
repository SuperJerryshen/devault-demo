import VaultManager from "@/tools/vaults/vaultManager";
import signMessage from "@/tools/wallets/walletSign";
import { Button, ButtonGroup } from "@heroui/button";
import { addToast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { FileVault, VaultsDataType } from "@/tools/vaults/types";
import { base64ToUint8Array } from "@/tools/crypto/utils";
import VaultLists from "./VaultLists";
import localforage from "localforage";

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
      </div>
    </div>
  );
}
