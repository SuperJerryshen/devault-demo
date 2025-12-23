import { VaultsDataType } from "@/tools/vaults/types";
import React, { useState } from "react";
import {
  ControlledTreeEnvironment,
  Tree,
  TreeItem,
  TreeItemIndex,
} from "react-complex-tree";

export default function VaultLists(props: {
  list: VaultsDataType;
  onChange?: (list: VaultsDataType) => void;
}) {
  const { list } = props;
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  return (
    <ControlledTreeEnvironment
      items={list}
      getItemTitle={(item) => item.data}
      viewState={{
        ["tree-2"]: {
          focusedItem,
          expandedItems,
          selectedItems,
        },
      }}
      onFocusItem={(item) => setFocusedItem(item.index)}
      onExpandItem={(item) => setExpandedItems([...expandedItems, item.index])}
      onCollapseItem={(item) =>
        setExpandedItems(
          expandedItems.filter(
            (expandedItemIndex) => expandedItemIndex !== item.index
          )
        )
      }
      onSelectItems={(items) => setSelectedItems(items)}
    >
      <Tree treeId="tree-2" rootItem="root" treeLabel="Tree Example" />
    </ControlledTreeEnvironment>
  );
}
