import PasswordInput from "@/components/PasswordInput";
import {
  DecodedVaultItemForWebsite,
  WebSiteAccountData,
} from "@/tools/vaults/types";
import { Button, ButtonGroup, toast } from "@heroui/react";
import { useEffect, useState } from "react";

export default function VaultEditor(props: {
  vault: DecodedVaultItemForWebsite;
  onSaveVault: (vault: DecodedVaultItemForWebsite) => Promise<void>;
  onCancel?: () => void;
}) {
  const { vault, onSaveVault, onCancel } = props;
  const [formData, setFormData] = useState<WebSiteAccountData>({
    ...vault?.vaultData,
  });

  const handleFormValueChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...(prev || {}),
      [name]: value,
    }));
  };

  useEffect(() => {
    setFormData({
      ...vault?.vaultData,
    });
  }, [vault]);

  return (
    <div>
      <div>Vault Editor</div>
      <form
        className="pb-30 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (vault) {
            onSaveVault({
              ...vault,
              vaultData: {
                ...formData,
              },
            });
            toast.success("Vault saved");
          }
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">User Name</label>
          <input
            value={formData.username}
            name="username"
            type="text"
            required
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) => {
              handleFormValueChange("username", e.target.value);
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <PasswordInput
            value={formData.password}
            required
            name="password"
            onChange={(e) => {
              handleFormValueChange("password", e.target.value);
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">URL</label>
          <input
            value={formData.url}
            name="url"
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) => {
              handleFormValueChange("url", e.target.value);
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <input
            value={formData.notes}
            name="notes"
            type="text"
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) => {
              handleFormValueChange("notes", e.target.value);
            }}
          />
        </div>

        <ButtonGroup>
          <Button type="submit">Save</Button>
          <Button onPress={onCancel}>Cancel</Button>
        </ButtonGroup>
      </form>
    </div>
  );
}
