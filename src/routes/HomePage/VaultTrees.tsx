import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  renamingFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import cn, { clsx } from "clsx";
import { omit } from "lodash-es";
import { VaultItemOrigin, VaultsDataType } from "@/tools/vaults/types";
import { Button, ButtonGroup } from "@heroui/button";
import { FolderIcon, FolderOpenIcon } from "@heroicons/react/24/outline";
import { addToast } from "@heroui/react";

const VaultTrees = (props: {
  value: VaultsDataType;
  onChange: (value: VaultsDataType) => void;
  onSelect: (itemId: string) => void;
}) => {
  const { value, onChange } = props;
  const tree = useTree<VaultItemOrigin>({
    rootItemId: "root",
    getItemName: (item) => item?.getItemData().data,
    isItemFolder: (item) => !!item?.getItemData().isFolder,
    dataLoader: {
      getItem: (itemId) => value[itemId],
      getChildren: (itemId) => value[itemId]?.children || [],
    },
    indent: 20,
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
      renamingFeature,
    ],
    onDrop: createOnDropHandler((item, newChildren) => {
      value[item.getId()].children = newChildren;
    }),
    state: value,
    setState: (val) => {
      const newVal = omit(val, [
        "expandedItems",
        "selectedItems",
        "focusedItem",
        "loadingItemChildrens",
        "loadingItemData",
        "renamingItem",
        "renamingValue",
        "dnd",
      ]) as VaultsDataType;
      onChange(newVal);
    },
    onRename(item, val) {
      console.log("onRename", item, val);
      if (!val) {
        addToast({ title: "Name cannot be empty", color: "danger" });
        return;
      }
      const data = item.getItemData();
      data.data = val;
    },
  });

  return (
    <div>
      <div>
        <ButtonGroup>
          <Button
            onPress={() => {
              const newFolderId = `folder-${Date.now()}`;
              value[newFolderId] = {
                index: newFolderId,
                data: "New Folder",
                isFolder: true,
                canMove: true,
                canRename: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                vaultData: null,
              };
              // Add to root's children
              if (!value["root"].children) {
                value["root"].children = [];
              }
              value["root"].children!.push(newFolderId);
              props.onChange?.({ ...value });
              setTimeout(() => {
                tree.rebuildTree();
              }, 100);
            }}
          >
            Add New Folder
          </Button>
          <Button
            onPress={() => {
              const newItemId = `item-${Date.now()}`;
              value[newItemId] = {
                index: newItemId,
                data: "New Item",
                isFolder: false,
                canMove: true,
                canRename: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                vaultData: {
                  url: "",
                  username: "",
                  password: "",
                  notes: "",
                },
              };
              // Add to root's children
              if (!value["root"].children) {
                value["root"].children = [];
              }
              value["root"].children!.push(newItemId);
              props.onChange?.({ ...value });
              setTimeout(() => {
                tree.rebuildTree();
              }, 100);
            }}
          >
            Add New Item
          </Button>
        </ButtonGroup>
      </div>
      <div {...tree.getContainerProps()} className="tree">
        {tree.getItems().map((item) => {
          const focused = item.isFocused();
          const expanded = item.isExpanded();
          const selected = item.isSelected();
          const folder = item.isFolder();
          return (
            <button
              {...item.getProps()}
              key={item.getId()}
              style={{ paddingLeft: `${item.getItemMeta().level * 20}px` }}
              className={clsx("w-full", selected ? "bg-blue-200" : "")}
            >
              <div
                className="flex items-center"
                onClick={() => {
                  if (!folder) {
                    props.onSelect(item.getId());
                  }
                }}
              >
                {folder ? (
                  expanded ? (
                    <FolderOpenIcon className="w-4 h-4 inline mr-2" />
                  ) : (
                    <FolderIcon className="w-4 h-4 inline mr-2" />
                  )
                ) : null}
                {item.isRenaming() ? (
                  <input {...item.getRenameInputProps()} />
                ) : (
                  <div
                    className={cn("treeitem", {
                      focused: focused,
                      expanded: expanded,
                      selected: selected,
                      folder: folder,
                    })}
                  >
                    {item.getItemName()}
                  </div>
                )}
              </div>
            </button>
          );
        })}
        <div
          style={tree.getDragLineStyle()}
          className="dragline bg-blue-500 h-1"
        />
      </div>
    </div>
  );
};

export default VaultTrees;
