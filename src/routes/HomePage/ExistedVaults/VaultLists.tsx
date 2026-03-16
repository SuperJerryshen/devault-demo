import { VaultItemOrigin, VaultsDataType } from "@/tools/vaults/types";
import { useRef, useState } from "react";
import SplitPane from "@uiw/react-split";
import VaultTrees from "./VaultTrees";
import VaultEditor from "./VaultEditor";
import VaultManager from "@/tools/vaults/vaultManager";
import { Card, Button } from "@heroui/react";
import { toast } from "@heroui/react";
import { TreeInstance } from "@headless-tree/core";
import {
  FolderOpenIcon,
  CursorArrowRaysIcon,
} from "@heroicons/react/24/outline";

export default function VaultLists(props: {
  list: VaultsDataType;
  onChange: (value: VaultsDataType) => void;
  vaultManagerRef: React.MutableRefObject<VaultManager | undefined>;
}) {
  const { list, onChange, vaultManagerRef } = props;
  const [selectedVault, setSelectedVault] = useState<VaultItemOrigin>();
  const treeRef = useRef<TreeInstance<VaultItemOrigin>>(null!);

  return (
    <div className="w-full h-[600px] flex flex-col">
      <SplitPane
        lineBar
        mode="horizontal"
        className="flex border border-default-200 rounded-xl overflow-hidden"
      >
        {/* 左侧树状视图 */}
        <div className="min-w-[280px] w-[40%]">
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
                toast.danger("Failed to decrypt vault item");
                return;
              }
              setSelectedVault(decodedVault);
            }}
            onAddNewItem={(vault) => {
              setSelectedVault(vault);
            }}
          />
        </div>

        {/* 右侧编辑区域 */}
        <div className="flex-1 min-w-[320px] bg-background">
          {selectedVault ? (
            <div className="h-full overflow-auto p-4">
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
                    toast.danger("Failed to encrypt vault item");
                    return;
                  }
                  const isNewVault = !list[vault.index];
                  list[vault.index] = encodedVault;
                  if (isNewVault) {
                    if (!list.root.children) {
                      list.root.children = [];
                    }
                    list.root.children.push(vault.index);
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
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <Card className="w-full max-w-md border-none shadow-none bg-transparent">
                <Card.Content className="flex flex-col items-center text-center gap-6">
                  <div className="p-6 bg-default-50 rounded-2xl">
                    <CursorArrowRaysIcon className="w-12 h-12 text-default-300" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-default-700">
                      Select an Item
                    </div>
                    <div className="text-sm text-default-500">
                      Choose an item from the tree on the left to view or edit its details
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-3 text-sm text-default-500 bg-default-50 px-4 py-3 rounded-xl">
                      <FolderOpenIcon className="w-5 h-5 text-default-400" />
                      <span>Browse folders to find your credentials</span>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}
        </div>
      </SplitPane>
    </div>
  );
}
