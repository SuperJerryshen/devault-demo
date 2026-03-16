import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  renamingFeature,
  selectionFeature,
  syncDataLoaderFeature,
  TreeInstance,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { clsx } from "clsx";
import { omit } from "lodash-es";
import {
  DecodedVaultItemForWebsite,
  VaultItemOrigin,
  VaultsDataType,
} from "@/tools/vaults/types";
import { Button, toast } from "@heroui/react";
import {
  TrashIcon,
  DocumentPlusIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useCallback } from "react";

const VaultTrees = (props: {
  value: VaultsDataType;
  onChange: (value: VaultsDataType) => void;
  onSelect: (itemId: string) => void;
  onAddNewItem?: (vault: VaultItemOrigin) => void;
  treeRef?: React.MutableRefObject<TreeInstance<VaultItemOrigin>>;
  selectedVault?: DecodedVaultItemForWebsite;
}) => {
  const { value, onChange, onAddNewItem, selectedVault } = props;

  // 递归删除函数，用于删除文件夹及其所有子项
  const deleteItemRecursively = useCallback(
    (itemId: string, currentValue: VaultsDataType): VaultsDataType => {
      const newValue = { ...currentValue };
      const item = newValue[itemId];
      if (!item) return newValue;
      if (item.isFolder && item.children) {
        for (const childId of item.children) {
          deleteItemRecursively(childId, newValue);
        }
      }
      for (const [, currentItem] of Object.entries(newValue)) {
        if (currentItem.children) {
          currentItem.children = currentItem.children.filter(
            (cid) => cid !== itemId,
          );
        }
      }
      delete newValue[itemId];
      return newValue;
    },
    [],
  );

  // 添加子项到指定文件夹
  const addItemToFolder = useCallback(
    (parentFolderId: string, isFolder: boolean = false) => {
      const newId = isFolder ? `folder-${Date.now()}` : `item-${Date.now()}`;
      const newItem: VaultItemOrigin = {
        index: newId,
        data: isFolder ? "New Folder" : "New Item",
        isFolder: isFolder,
        canMove: true,
        canRename: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vaultData: isFolder
          ? null
          : {
              url: "",
              username: "",
              password: "",
              notes: "",
              type: "website",
            },
      };
      const newValue = { ...value };
      newValue[newId] = newItem;
      if (!newValue[parentFolderId].children) {
        newValue[parentFolderId].children = [];
      }
      newValue[parentFolderId].children!.push(newId);
      onChange(newValue);
      if (!isFolder && onAddNewItem) {
        onAddNewItem(newItem);
      }
    },
    [value, onChange, onAddNewItem],
  );

  const tree = useTree<VaultItemOrigin>({
    rootItemId: "root",
    getItemName: (item) => item?.getItemData().data,
    isItemFolder: (item) => !!item?.getItemData().isFolder,
    dataLoader: {
      getItem: (itemId) => value[itemId],
      getChildren: (itemId) => value[itemId]?.children || [],
    },
    indent: 24,
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
      if (!val) {
        toast.danger("Name cannot be empty");
        return;
      }
      const data = item.getItemData();
      data.data = val;
    },
    onPrimaryAction(item) {
      const itemId = item.getId();
      const isFolder = item.isFolder();
      if (!isFolder) {
        props.onSelect(itemId);
      }
    },
  });

  useEffect(() => {
    if (props.treeRef) {
      props.treeRef.current = tree;
    }
  }, [tree]);

  const handleAddRootFolder = () => {
    addItemToFolder("root", true);
  };

  const handleAddRootItem = () => {
    const newId = `item-${Date.now()}`;
    const newItem: VaultItemOrigin = {
      index: newId,
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
        type: "website",
      },
    };
    onAddNewItem && onAddNewItem(newItem);
  };

  const handleDeleteItem = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const item = value[itemId];
    if (!item) return;
    const itemName = item.data;
    const isFolder = item.isFolder;
    if (
      confirm(
        `Are you sure you want to delete "${itemName}"? ${isFolder ? "All contents will be deleted." : ""}`,
      )
    ) {
      const newValue = deleteItemRecursively(itemId, { ...value });
      onChange(newValue);
      toast.success(`${isFolder ? "Folder" : "Item"} deleted`);
    }
  };

  return (
    <div className="bg-default-50/50 rounded-xl border border-default-200 overflow-hidden">
      <div className="bg-default-100/50 px-4 py-3 border-b border-default-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderIcon className="w-5 h-5 text-default-500" />
          <span className="text-sm font-medium text-default-700">
            Vault Explorer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="tertiary"
            className="h-8 gap-1.5"
            onPress={handleAddRootFolder}
          >
            <FolderPlusIcon className="w-4 h-4" />
            New Folder
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5"
            onPress={handleAddRootItem}
          >
            <DocumentPlusIcon className="w-4 h-4" />
            New Item
          </Button>
        </div>
      </div>

      <div
        {...tree.getContainerProps()}
        className="tree max-h-[500px] overflow-auto p-2"
      >
        {tree.getItems().map((item) => {
          const focused = item.isFocused();
          const expanded = item.isExpanded();
          const selected = item.isSelected();
          // const isEdit =
          const isFolder = item.isFolder();
          const itemId = item.getId();
          const isRoot = itemId === "root";
          const isRenaming = item.isRenaming();
          const isEdit =
            !isFolder &&
            selectedVault &&
            selectedVault.index === item.getItemData().index;

          if (isRoot) return null;

          return (
            <div key={itemId} className="group relative">
              <div
                {...item.getProps()}
                style={{ paddingLeft: `${item.getItemMeta().level * 24}px` }}
                className={clsx(
                  "w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm outline-none cursor-pointer m-0.5",
                  selected || isEdit
                    ? "bg-blue-300 text-primary-foreground"
                    : "hover:bg-default-100/80",
                  focused && !selected && "ring-1 ring-primary/30 ring-inset",
                )}
              >
                <span className="flex items-center justify-center w-4 h-4 shrink-0">
                  {isFolder ? (
                    expanded ? (
                      <ChevronDownIcon className="w-3.5 h-3.5 text-default-400" />
                    ) : (
                      <ChevronRightIcon className="w-3.5 h-3.5 text-default-400" />
                    )
                  ) : (
                    <span className="w-3.5 h-3.5" />
                  )}
                </span>

                <span className="flex items-center justify-center w-4 h-4 shrink-0">
                  {isFolder ? (
                    expanded ? (
                      <FolderOpenIcon className="w-4 h-4 text-default-600" />
                    ) : (
                      <FolderIcon className="w-4 h-4 text-default-600" />
                    )
                  ) : (
                    <DocumentTextIcon className="w-4 h-4 text-default-500" />
                  )}
                </span>

                <div className="flex-1 text-left min-w-0">
                  {isRenaming ? (
                    <input
                      {...item.getRenameInputProps()}
                      className="w-full bg-background border border-default-300 rounded px-1 py-0.5 text-sm outline-none focus:border-primary"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{item.getItemName()}</span>
                  )}
                </div>

                {!isRenaming && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {isFolder && (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItemToFolder(itemId, true);
                          }}
                          className="p-1 rounded hover:bg-default-200/80 text-default-500 hover:text-default-700 transition-colors"
                          title="Add Subfolder"
                        >
                          <FolderPlusIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItemToFolder(itemId, false);
                          }}
                          className="p-1 rounded hover:bg-default-200/80 text-default-500 hover:text-default-700 transition-colors"
                          title="Add Item"
                        >
                          <DocumentPlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => handleDeleteItem(itemId, e)}
                      className="p-1 rounded hover:bg-danger/10 text-default-500 hover:text-danger transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div
          style={tree.getDragLineStyle()}
          className="dragline bg-primary h-0.5 rounded-full mx-2"
        />
      </div>

      <div className="bg-default-100/30 px-4 py-2 border-t border-default-200">
        <span className="text-xs text-default-500">
          Click to select • Click folder to expand/collapse • Double-click or F2
          to rename
        </span>
      </div>
    </div>
  );
};

export default VaultTrees;
