import { KiiChain } from "@kiichain/kiichain";

export function useKiiChain() {
  const kiiChain = new KiiChain();
  // ... rest of the hook logic
  // Update any chain interaction methods to use kiiChain
  return kiiChain;
}