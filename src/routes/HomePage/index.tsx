import { Button } from "@heroui/react";
import signMessage from "../../tools/wallets/walletSign";
import walletClient from "../../tools/wallets/walletClient";
import publicClient from "../../tools/wallets/publicClient";
import deriveKeyFromSign from "../../tools/crypto/deriveKeyFromSign";
import generateNewVault from "../../tools/vaults/generateNewVault";
import ExistedVaults from "./ExistedVaults";
import { useEffect, useMemo, useState } from "react";
import localforage from "localforage";
import { FileVault } from "@/tools/vaults/types";

interface FileVaultStorage {
  [address: string]: FileVault;
}

export default function HomePage() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [vaultData, setVaultData] = useState<FileVaultStorage>({});

  const currentVault = useMemo(() => {
    if (addresses.length === 0) {
      return null;
    }
    const address = addresses[0];
    return vaultData[address] || null;
  }, [addresses, vaultData]);

  useEffect(() => {
    async function fetchAddresses() {
      const addrs = await walletClient.getAddresses();
      setAddresses(addrs);
      const vaultData = await localforage.getItem<{
        [address: string]: FileVault;
      }>("vaultdata");
      setVaultData(vaultData || {});
      console.log("vaultData", vaultData);
    }
    fetchAddresses();
  }, []);

  return (
    <div>
      <div>HomePage</div>
      {!currentVault && (
        <div>
          <Button
            onClick={async () => {
              const addresses = await walletClient.requestAddresses();
              console.log("addresses", addresses);
            }}
          >
            Connect Wallet
          </Button>
          <Button
            onClick={async () => {
              const sign = await signMessage();
              console.log("sign", sign);
              if (!sign) {
                return;
              }
              const addresses = await walletClient.getAddresses();
              const address = addresses[0];
              const result = await publicClient.verifyMessage({
                message: "Hello, Devault!",
                signature: sign,
                address,
              });
              const { derivedKey, salt } = await deriveKeyFromSign(sign);
              const vaultData = await generateNewVault(
                derivedKey,
                salt,
                walletClient.chain
              );
              const vaultFile = JSON.parse(JSON.stringify(vaultData[0]));
              localforage.setItem<FileVaultStorage>("vaultdata", {
                [address]: vaultFile,
              });
              setVaultData({
                [address]: vaultFile,
              });
              const sto =
                await localforage.getItem<FileVaultStorage>("vaultdata");
              console.log("sto", sto);
              setAddresses(addresses);
              console.log("vaultData", vaultData);
              // console.log("encryptedDek", uint8ArrayToHextString(encryptedDek));
              // console.log(uint8ArrayToBase64(encryptedDek));
            }}
          >
            Wallet Sign Message
          </Button>
        </div>
      )}
      <ExistedVaults addresses={addresses} vaultData={vaultData} />
    </div>
  );
}
