import { addToast, Button } from "@heroui/react";
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
  const [addresses, setAddresses] = useState<`0x${string}`[]>([]);
  const [vaultData, setVaultData] = useState<FileVaultStorage>({});
  const [loading, setLoading] = useState(false);

  const currentVault = useMemo(() => {
    if (addresses.length === 0) {
      return null;
    }
    const address = addresses[0];
    return vaultData[address] || null;
  }, [addresses, vaultData]);

  const getLocalVaultData = async (address: `0x${string}`) => {
    const vaultData = await localforage.getItem<{
      [address: string]: FileVault;
    }>(`vaultdata_${address}`);
    setVaultData(vaultData || {});
    console.log("vaultData", vaultData);
  };

  useEffect(() => {
    async function fetchAddresses() {
      const addrs = await walletClient.getAddresses();
      setAddresses(addrs);
      if (addrs.length === 0) {
        return;
      }
      await getLocalVaultData(addrs[0]);
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
              console.log("addresses", addresses);
              setAddresses(addresses);
              await getLocalVaultData(addresses[0]);
            } catch (error) {
              addToast({ title: "Failed to connect wallet", color: "danger" });
            }
          }}
        >
          Connect Wallet
        </Button>
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
                localforage.setItem<FileVaultStorage>(`vaultdata_${address}`, {
                  [address]: vaultFile,
                });
                setVaultData({
                  [address]: vaultFile,
                });
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
