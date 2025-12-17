import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const publicClient = createPublicClient({
  // chain: {
  //   id: 31337,
  //   name: "ThaiChain",
  //   nativeCurrency: { name: "GOOO", symbol: "GO", decimals: 18 },
  //   rpcUrls: {
  //     default: { http: ["http://127.0.0.1:8545"] },
  //   },
  // },
  // chain: mainnet,
  chain: sepolia,
  transport: http(sepolia.rpcUrls.default.http[0]),
});

export default publicClient;
