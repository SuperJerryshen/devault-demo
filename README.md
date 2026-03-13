# DeVault Project Skills

## Project Overview

DeVault 是一个去中心化密码管理器，使用区块链 + IPFS 进行数据存储。

## Technology Stack

| Category             | Technology                           |
| -------------------- | ------------------------------------ |
| Frontend Framework   | React 18.3.1 + TypeScript            |
| UI Component Library | @heroui/react 2.8.6                  |
| Blockchain           | viem 2.43.1 (Ethereum Sepolia)       |
| IPFS                 | helia 6.0.14 + @helia/json           |
| Local Storage        | localforage 1.10.0 (IndexedDB)       |
| Build Tool           | Vite 6.0.11                          |
| Styling              | Tailwind CSS 4.1.11                  |
| Encryption           | Web Crypto API (AES-256-GCM, PBKDF2) |

## Project Structure

```
src/
├── tools/                    # 核心业务逻辑
│   ├── crypto/              # 加密相关
│   │   ├── dek.ts           # AES-256-GCM 加密/解密
│   │   ├── deriveKeyFromSign.ts  # PBKDF2 密钥派生
│   │   └── utils.ts         # 工具函数
│   ├── vaults/              # Vault 管理
│   │   ├── vaultManager.ts  # Vault 加密/解密/解锁/锁定
│   │   ├── generateNewVault.ts  # 生成新 Vault
│   │   └── types.d.ts       # 类型定义
│   ├── wallets/             # 区块链交互
│   │   ├── storageContract.ts   # 智能合约 (IPFS CID 存储)
│   │   ├── walletClient.ts  # 钱包客户端
│   │   ├── publicClient.ts # 公共客户端 (读取区块链)
│   │   └── walletSign.ts   # EIP-712 签名
│   └── ipfs.ts             # IPFS 上传/下载/缓存
├── routes/                  # 路由页面
│   └── HomePage/
│       ├── index.tsx        # 首页 (连接钱包/生成Vault)
│       └── ExistedVaults/
│           ├── index.tsx   # Vault 操作页面
│           ├── VaultLists.tsx
│           ├── VaultTrees.tsx
│           └── VaultEditor.tsx
└── components/              # 通用组件
```

## Key Modules

### IPFS Module (`src/tools/ipfs.ts`)

- `uploadToIpfs(data)` - 上传数据到 IPFS，返回 CID
- `getFromIpfs<T>(cid)` - 通过 CID 从 IPFS 获取数据（多网关 + 重试）
- `saveToLocalCache(cid, data)` - 保存到 IndexedDB 缓存
- `getFromLocalCache(cid)` - 从缓存读取

### Vault Manager (`src/tools/vaults/vaultManager.ts`)

```typescript
class VaultManager {
  originalFileVault: FileVault;
  decodedFileVault?: DecodedFileVault;

  async unlock(address, sign, salt); // 解锁 Vault
  async encryptFileVault(); // 加密 Vault
  async lock(); // 锁定 Vault
  async decryptVaultItem(item); // 解密单个条目
  async encryptVaultItem(item); // 加密单个条目
}
```

### Blockchain Contract (`src/tools/wallets/storageContract.ts`)

- 合约地址: `0x81660ce5d55147a67024913560fe6e6bc33131a8` (Sepolia)
- `getIpfs({ account })` - 读取链上存储的 IPFS CID
- `setIpfs([cid])` - 写入 IPFS CID 到链上

## Data Flow

### 保存 Vault 到 IPFS + 区块链

```
用户点击 "Contract set ipfs storage"
    ↓
vaultManager.encryptFileVault() 加密数据
    ↓
uploadToIpfs() 上传到 IPFS
    ↓
contract.write.setIpfs([cid]) 同步 CID 到区块链
    ↓
saveToLocalCache(cid, vaultData) 缓存到本地
```

### 从区块链恢复 Vault

```
用户点击 "Unlock Vault" / "Connect Wallet"
    ↓
contract.read.getIpfs({ account }) 获取链上 CID
    ↓
getFromLocalCache(cid) 检查本地缓存
    │
    ├── 有缓存 → 直接使用
    │
    └── 无缓存 → getFromIpfs(cid) 从 IPFS 获取
                    ↓
                saveToLocalCache() 缓存
    ↓
vaultManager.unlock() 解锁
```

## Coding Conventions

- 使用 TypeScript，严格类型
- 组件使用 React Hooks (useState, useEffect, useRef)
- 样式使用 Tailwind CSS
- 使用 @heroui/react 组件库
- 使用 @/ 路径别名 (配置在 tsconfig.json)
- 避免 console.log（仅用于调试）
- 所有 async 函数需要 try-catch 错误处理

## Common Commands

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run lint     # 代码检查
```

## MCP Server

项目包含一个 MCP Server (`mcp-server/`)，提供以下工具：

- `getIpfsCid` - 从区块链获取 IPFS CID
- `setIpfsCid` - 上传到 IPFS 并同步到区块链
- `getFromIpfs` - 从 IPFS 获取数据
- `getFromLocalCache` - 从本地缓存获取
- `saveToLocalCache` - 保存到本地缓存
