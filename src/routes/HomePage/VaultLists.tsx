import { VaultItemOrigin, VaultsDataType } from "@/tools/vaults/types";
import { useState } from "react";
import SplitPane from "@uiw/react-split";
import VaultTrees from "./VaultTrees";

export default function VaultLists(props: {
  list: VaultsDataType;
  onChange: (value: VaultsDataType) => void;
}) {
  const { list, onChange } = props;
  const [selectedVault, setSelectedVault] = useState<VaultItemOrigin>();

  return (
    <div className="w-dvw h-dvh flex flex-col">
      <SplitPane lineBar mode="horizontal" className="flex">
        <div className="min-w-3xs w-1/3">
          <VaultTrees
            value={list}
            onChange={onChange}
            onSelect={(id) => {
              setSelectedVault(list[id]);
            }}
          />
        </div>
        <div className="w-full min-w-2xs">
          <div>Vault Editor</div>
          <div>Vault Data:</div>
          <pre>{JSON.stringify(selectedVault, null, 2)}</pre>
        </div>
      </SplitPane>
    </div>
  );
}
