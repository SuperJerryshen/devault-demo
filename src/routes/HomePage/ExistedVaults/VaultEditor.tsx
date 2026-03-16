import PasswordInput from "@/components/PasswordInput";
import {
  DecodedVaultItemForWebsite,
  WebSiteAccountData,
} from "@/tools/vaults/types";
import {
  Button,
  Card,
  TextField,
  Label,
  Input,
  toast,
  Separator,
} from "@heroui/react";
import { useEffect, useState } from "react";
import {
  UserIcon,
  LockClosedIcon,
  LinkIcon,
  DocumentTextIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

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
    <Card className="w-full border-none shadow-xl overflow-hidden">
      <Card.Header className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent pb-6">
        <Card.Title>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <PencilIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xl font-bold">Edit Credential</div>
              <div className="text-sm text-default-500">
                Update your account details
              </div>
            </div>
          </div>
        </Card.Title>
      </Card.Header>
      <Card.Content className="space-y-5 pt-6">
        <TextField className="group">
          <Label className="text-sm font-medium text-default-700 mb-1.5 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-default-400 group-focus-within:text-primary transition-colors" />
            Username
          </Label>
          <Input
            value={formData.username}
            name="username"
            type="text"
            placeholder="Enter your username"
            required
            onChange={(e) => {
              handleFormValueChange("username", e.target.value);
            }}
            className="h-12"
          />
        </TextField>

        <TextField className="group">
          <Label className="text-sm font-medium text-default-700 mb-1.5 flex items-center gap-2">
            <LockClosedIcon className="w-4 h-4 text-default-400 group-focus-within:text-primary transition-colors" />
            Password
          </Label>
          <PasswordInput
            value={formData.password}
            required
            name="password"
            placeholder="Enter your password"
            onChange={(e) => {
              handleFormValueChange("password", e.target.value);
            }}
          />
        </TextField>

        <TextField className="group">
          <Label className="text-sm font-medium text-default-700 mb-1.5 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-default-400 group-focus-within:text-primary transition-colors" />
            Website URL
          </Label>
          <Input
            value={formData.url}
            name="url"
            type="text"
            placeholder="https://example.com"
            onChange={(e) => {
              handleFormValueChange("url", e.target.value);
            }}
            className="h-12"
          />
        </TextField>

        <TextField className="group">
          <Label className="text-sm font-medium text-default-700 mb-1.5 flex items-center gap-2">
            <DocumentTextIcon className="w-4 h-4 text-default-400 group-focus-within:text-primary transition-colors" />
            Notes
          </Label>
          <Input
            value={formData.notes}
            name="notes"
            type="text"
            placeholder="Add any additional notes..."
            onChange={(e) => {
              handleFormValueChange("notes", e.target.value);
            }}
            className="h-12"
          />
        </TextField>
      </Card.Content>
      <Separator className="my-1" />
      <Card.Footer className="pt-4 pb-6">
        <form
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
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              type="button"
              onPress={onCancel}
              variant="secondary"
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 h-12">
              Save Changes
            </Button>
          </div>
        </form>
      </Card.Footer>
    </Card>
  );
}
