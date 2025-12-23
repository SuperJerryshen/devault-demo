import VaultManager from "@/tools/vaults/vaultManager";
import signMessage from "@/tools/wallets/walletSign";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/react";
import { useRef, useState } from "react";
import * as dek from "@/tools/crypto/dek";
import {
  FileVault,
  VaultItemOrigin,
  VaultsDataType,
} from "@/tools/vaults/types";
import { base64ToUint8Array } from "@/tools/crypto/utils";
import VaultLists from "./VaultLists";

(window as any).dek = dek;

export default function ExistedVaults(props: {
  address?: `0x${string}`;
  vaultData: { [address: string]: FileVault };
}) {
  const { address, vaultData } = props;
  const vaultManagerRef = useRef<VaultManager>();
  const [vaultLists, setVaultLists] = useState<VaultsDataType>();

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
            <div>Vault Data:</div>
            <pre>{JSON.stringify(vaultLists, null, 2)}</pre>

            <VaultLists list={vaultLists} onChange={setVaultLists} />
          </div>
        ) : (
          <Button
            onPress={async () => {
              const fileVault = vaultData[address];
              if (!fileVault) {
                return;
              }
              const vaultManager = new VaultManager(fileVault);
              const sign = await signMessage();
              console.log("decrypting with sign:", sign);
              if (!sign) {
                addToast({ title: "Failed to sign message", color: "danger" });
                return;
              }
              const salt = base64ToUint8Array(fileVault.headers.ciphers.salt);
              await vaultManager.unlock(sign, salt);
              addToast({ title: "Vault unlocked", color: "success" });
              setVaultLists(vaultManager.decodedFileVault?.vaults);
              vaultManagerRef.current = vaultManager;
              console.log("vaultManager", vaultManager);
            }}
          >
            Unlock Vault
          </Button>
        )}
      </div>
    </div>
  );
}
