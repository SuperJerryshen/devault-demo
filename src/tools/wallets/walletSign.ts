import { addToast, toast } from "@heroui/react";
import walletClient from "./walletClient";

async function signMessage() {
  let addresses = await walletClient.getAddresses();
  console.log(walletClient);
  const account = addresses[0];
  if (!account) {
    try {
      addresses = await walletClient.requestAddresses();
    } catch (error) {
      addToast({ title: "Please connect your wallet first", color: "danger" });
      return;
    }
  }
  console.log("walletClient.chain.id", walletClient.chain.id);
  return await walletClient.signTypedData({
    domain: {
      name: "Devault",
      chainId: BigInt(walletClient.chain.id),
    },
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "chainId", type: "uint256" },
      ],
      VaultAuth: [
        { name: "purpose", type: "string" },
        { name: "tips", type: "string" },
      ],
    },
    primaryType: "VaultAuth",
    message: {
      purpose: "Vault Access",
      tips: "Sign this message to access your vault securely.",
    },
    account,
  });
  return await walletClient.signMessage({
    message: "Hello, Devault!",
    account,
  });
}

export default signMessage;
