import { DecodedVaultItemForWebsite } from "@/tools/vaults/types";
import { Button, ButtonGroup } from "@heroui/button";
import { Form } from "@heroui/react";

export default function VaultEditor(props: {
  vault?: DecodedVaultItemForWebsite;
  onSaveVault: (vault: DecodedVaultItemForWebsite) => Promise<void>;
  onCancel?: () => void;
}) {
  const { vault, onSaveVault, onCancel } = props;

  if (!vault) {
    return (
      <div>
        <div>No vault selected.</div>
      </div>
    );
  }

  return (
    <div>
      <div>Vault Editor</div>
      <div>Vault Data:</div>
      <pre>{JSON.stringify(vault, null, 2)}</pre>

      <Form></Form>

      <ButtonGroup>
        <Button
          onPress={() => {
            if (vault) {
              onSaveVault(vault);
            }
          }}
        >
          Save
        </Button>
        <Button onPress={onCancel}>Cancel</Button>
      </ButtonGroup>
    </div>
  );
}
