import { getContract } from "viem";
import publicClient from "./publicClient";
import walletClient from "./walletClient";

const contract = getContract({
  address: "0x81660ce5d55147a67024913560fe6e6bc33131a8",
  client: { public: publicClient, wallet: walletClient },
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: false,
          internalType: "string",
          name: "ipfs",
          type: "string",
        },
      ],
      name: "StorageSuccess",
      type: "event",
    },
    {
      inputs: [],
      name: "getIpfs",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "ipfs",
          type: "string",
        },
      ],
      name: "setIpfs",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
});

export default contract;
