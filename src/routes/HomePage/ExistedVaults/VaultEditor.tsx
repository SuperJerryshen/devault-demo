import PasswordInput from "@/components/PasswordInput";
import {
  DecodedVaultItemForWebsite,
  WebSiteAccountData,
} from "@/tools/vaults/types";
import { Form, Input, Button, ButtonGroup, addToast } from "@heroui/react";
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
      <Form
        className="pb-30"
        onSubmit={(e) => {
          e.preventDefault();
          if (vault) {
            onSaveVault({
              ...vault,
              vaultData: {
                ...formData,
              },
            });
            addToast({ title: "Vault saved", color: "success" });
          }
        }}
      >
        <Input
          value={formData.username}
          name="username"
          type="text"
          required
          label="User Name"
          onChange={(e) => {
            handleFormValueChange("username", e.target.value);
          }}
        />
        <PasswordInput
          value={formData.password}
          required
          name="password"
          label="Password"
          onChange={(e) => {
            handleFormValueChange("password", e.target.value);
          }}
        />
        <Input
          value={formData.url}
          name="url"
          type="text"
          label="URL"
          onChange={(e) => {
            handleFormValueChange("url", e.target.value);
          }}
        />
        <Input
          value={formData.notes}
          name="notes"
          type="text"
          label="Notes"
          onChange={(e) => {
            handleFormValueChange("notes", e.target.value);
          }}
        />

        <ButtonGroup>
          <Button type="submit">Save</Button>
          <Button onPress={onCancel}>Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  );
}
