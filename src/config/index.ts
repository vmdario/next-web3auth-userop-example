export const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
export const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0x9406Cc6185a346906296840746125a0E44976454";
export const PAYMASTER_CONTEXT = {
  type: "payg",
};

export function getEnvConfig() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const pmUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL;
  const web3AuthClientId = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID;

  if (!web3AuthClientId) {
    throw new Error("WEB3AUTH_CLIENT_ID is undefined");
  }

  if (!rpcUrl) {
    throw new Error("RPC_URL is undefined");
  }

  if (!pmUrl) {
    throw new Error("PAYMASTER_RPC_URL is undefined");
  }
  return { rpcUrl, pmUrl, web3AuthClientId };
}
