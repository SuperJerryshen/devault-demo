import { createWalletClient, custom } from "viem";
import { mainnet, arbitrum, sepolia } from "viem/chains";

console.log("chains", mainnet, arbitrum);

const walletClient = createWalletClient({
  // chain: {
  //   id: 31337,
  //   name: "ThaiChain",
  //   nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  //   rpcUrls: {
  //     default: { http: ["http://127.0.0.1:8545"] },
  //   },
  // },
  // chain: mainnet,
  chain: sepolia,
  transport: custom((window as any).ethereum),
});

export default walletClient;
