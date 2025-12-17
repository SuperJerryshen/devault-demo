import VaultManager from "@/tools/vaults/vaultManager";
import signMessage from "@/tools/wallets/walletSign";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/react";
import { useState } from "react";
import * as dek from "@/tools/crypto/dek";
import { FileVault } from "@/tools/vaults/types";
import { base64ToUint8Array } from "@/tools/crypto/utils";

(window as any).dek = dek;

export default function ExistedVaults(props: {
  addresses: string[];
  vaultData: { [address: string]: FileVault };
}) {
  const { addresses, vaultData } = props;
  const [currentVault, setCurrentVault] = useState<VaultManager>();
  return (
    <div>
      <div>ExistedVaults</div>
      {addresses.map((address) => (
        <div key={address}>
          <div>Address:</div>
          <div>{address}</div>
          <Button
            onClick={async () => {
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
              setCurrentVault(vaultManager);
              console.log("vaultManager", vaultManager);
            }}
          >
            Unlock
          </Button>
          {currentVault && (
            <div>
              <div>Vault Data:</div>
              <pre>
                {JSON.stringify(currentVault?.decodedFileVault, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
