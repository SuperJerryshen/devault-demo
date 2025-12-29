import { VaultItemOrigin, VaultsDataType } from "@/tools/vaults/types";
import { useRef, useState } from "react";
import SplitPane from "@uiw/react-split";
import VaultTrees from "./VaultTrees";
import VaultEditor from "./VaultEditor";
import VaultManager from "@/tools/vaults/vaultManager";
import { addToast } from "@heroui/react";
import { TreeInstance } from "@headless-tree/core";

export default function VaultLists(props: {
  list: VaultsDataType;
  onChange: (value: VaultsDataType) => void;
  vaultManagerRef: React.MutableRefObject<VaultManager | undefined>;
}) {
  const { list, onChange, vaultManagerRef } = props;
  const [selectedVault, setSelectedVault] = useState<VaultItemOrigin>();
  const treeRef = useRef<TreeInstance<VaultItemOrigin>>(null!);

  return (
    <div className="w-dvw h-dvh flex flex-col">
      <SplitPane lineBar mode="horizontal" className="flex">
        <div className="min-w-3xs w-1/3 p-2">
          <VaultTrees
            treeRef={treeRef}
            value={list}
            onChange={onChange}
            onSelect={async (id) => {
              const encodedVault = list[id];
              if (!encodedVault) {
                setSelectedVault(undefined);
                return;
              }
              const decodedVault =
                await vaultManagerRef.current?.decryptVaultItem(encodedVault);
              if (!decodedVault) {
                addToast({
                  title: "Failed to decrypt vault item",
                  color: "danger",
                });
                return;
              }
              setSelectedVault(decodedVault);
            }}
            onAddNewItem={(vault) => {
              setSelectedVault(vault);
            }}
          />
        </div>
        <div className="w-full min-w-2xs p-2">
          {selectedVault ? (
            <VaultEditor
              vault={selectedVault}
              onSaveVault={async (vault) => {
                const vaultData = vault.vaultData;
                const vaultManager = vaultManagerRef.current;
                if (!vaultManager || !vaultData) {
                  return;
                }
                const encodedVault = await vaultManager.encryptVaultItem(vault);
                if (!encodedVault) {
                  addToast({
                    title: "Failed to encrypt vault item",
                    color: "danger",
                  });
                  return;
                }
                const isNewVault = !list[vault.index];
                list[vault.index] = encodedVault;
                if (isNewVault) {
                  list.root.children?.push(vault.index);
                }
                onChange({ ...list });
                setSelectedVault(undefined);
                setTimeout(() => {
                  treeRef.current?.rebuildTree();
                }, 100);
              }}
              onCancel={() => {
                setSelectedVault(undefined);
              }}
            />
          ) : (
            <div>
              <div>No vault selected.</div>
            </div>
          )}
        </div>
      </SplitPane>
    </div>
  );
}
