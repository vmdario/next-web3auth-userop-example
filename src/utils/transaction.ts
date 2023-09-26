import { ENTRY_POINT_ADDRESS, getEnvConfig } from "@/config";
import { Client, ISendUserOperationOpts, IUserOperationBuilder } from "userop";

export async function sendUserOperation({
  userOperation,
  opts
}: {
  userOperation: IUserOperationBuilder,
  opts: ISendUserOperationOpts
}) {
  const { rpcUrl } = getEnvConfig();

  const client = await Client.init(rpcUrl, { entryPoint: ENTRY_POINT_ADDRESS });
  console.log(userOperation, opts);
  return await client.sendUserOperation(userOperation, opts);
}