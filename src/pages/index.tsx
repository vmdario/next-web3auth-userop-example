import { ENTRY_POINT_ADDRESS, PAYMASTER_CONTEXT, SIMPLE_ACCOUNT_FACTORY_ADDRESS, getEnvConfig } from "@/config";
import EthereumRpc from "@/utils/ethersRpc";
import { sendUserOperation } from "@/utils/transaction";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { getAddress, JsonRpcProvider, parseEther, toQuantity, Wallet } from "ethers";
import { useEffect, useState } from "react";
import { Client, Presets } from "userop";

export default function Home() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [account, setAccount] = useState<Presets.Builder.SimpleAccount | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [events, setEvents] = useState<string[]>([
    `A sample application to demonstrate how to integrate self-custodial\nsocial login and transacting with Web3Auth and userop.js.`,
  ]);
  const [loading, setLoading] = useState(false);
  const { pmUrl, web3AuthClientId, rpcUrl } = getEnvConfig();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const provider = new JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        const web3auth = new Web3Auth({
          clientId: web3AuthClientId,
          web3AuthNetwork: "testnet",
          enableLogging: true,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: toQuantity(chainId),
            rpcTarget: rpcUrl,
          },
        });

        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "optional", // Pass on the mfa level of your choice: default, optional, mandatory, none
          },
          adapterSettings: {},
        });
        web3auth.configureAdapter(openloginAdapter);

        setWeb3auth(web3auth);
        if (web3auth.provider) {
          setProvider(web3auth.provider);
        }
        await web3auth.initModal();

        setAuthorized(web3auth).catch(console.log);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const createAccount = async (privateKey: string) => {
    return await Presets.Builder.SimpleAccount.init(
      new Wallet(privateKey) as any,
      rpcUrl,
      ENTRY_POINT_ADDRESS,
      SIMPLE_ACCOUNT_FACTORY_ADDRESS,
      Presets.Middleware.verifyingPaymaster(pmUrl, PAYMASTER_CONTEXT) // or undefined
    );
  };

  const getPrivateKey = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const rpc = new EthereumRpc(provider);
    const privateKey = await rpc.getPrivateKey();
    return privateKey;
  };

  const setAuthorized = async (w3auth: Web3Auth) => {
    if (!w3auth.provider) {
      throw new Error("web3authprovider not initialized yet");
    }
    const authenticateUser = await w3auth.authenticateUser();
    console.log({ authenticateUser });

    const privateKey = await getPrivateKey();
    console.log({ privateKey });

    const acc = await createAccount(privateKey);
    console.log({ account: acc });

    setIdToken(authenticateUser.idToken);
    setAccount(acc);
    setPrivateKey(privateKey);
    console.log(await getUserInfo());
  };

  const login = async () => {
    if (!web3auth) {
      throw new Error("web3auth not initialized yet");
    }
    const web3authProvider = await web3auth.connect();
    if (!web3authProvider) {
      throw new Error("web3authprovider not initialized yet");
    }
    setAuthorized(web3auth);
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    const user = await web3auth.getUserInfo();
    console.log(user);
  };

  const logout = async () => {
    if (!web3auth) {
      throw new Error("web3auth not initialized yet");
    }
    await web3auth.logout();
    setAccount(null);
    setIdToken(null);
    setPrivateKey(null);
    setProvider(null);
    window.localStorage.clear();
  };

  const addEvent = (newEvent: string) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  const sendTransaction = async () => {
    setEvents([]);
    if (!account) {
      throw new Error("Account not initialized");
    }
    addEvent("Sending transaction...");

    const to = "0x858E244B392A566Af387a27798d2B4A73D367CA3";
    const value = parseEther("0");
    const data = "0x";
    const res = await sendUserOperation({
      userOperation: account.execute(to, value, data),
      opts: {
        onBuild: async (op) => {
          addEvent(`Signed UserOperation: `);
          addEvent(JSON.stringify(op, null, 2) as any);
        },
      },
    });
    addEvent(`UserOpHash: ${res.userOpHash}`);

    addEvent("Waiting for transaction...");
    const ev = await res.wait();
    addEvent(`Transaction hash: ${ev?.transactionHash ?? null}`);
  };

  if (loading) {
    return <p>loading...</p>;
  }
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`}>
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div></div>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          {account ? (
            <div className="space-y-4">
              <div className="flex justify-end space-x-4">
                <p className="flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                  Logged in as&nbsp;
                  <code className="font-mono font-bold text-green-300">{account?.getSender()}</code>
                </p>

                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 self-center"
                >
                  Logout
                </button>
              </div>
              <div>
                <div className="grid grid-cols-3 grid-rows-2 gap-4">
                  <div className="col-span-1 row-span-2">
                    <button
                      className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                      onClick={() => sendTransaction()}
                    >
                      <h2 className={`mb-3 text-2xl font-semibold`}>Transfer </h2>
                      <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
                        Simple transfer of 0 ETH to an arbitrary address with gas sponsored.
                      </p>
                    </button>
                    <button
                      className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                      onClick={() => (privateKey ? setEvents([`private key: ${privateKey}`]) : undefined)}
                    >
                      <h2 className={`mb-3 text-2xl font-semibold`}>Private Key </h2>
                      <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
                        Print the private key of the account reconstructed by Web3Auth.
                      </p>
                    </button>
                    <button
                      className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                      onClick={() => (idToken ? setEvents([`OAuth ID token: ${idToken}`]) : undefined)}
                    >
                      <h2 className={`mb-3 text-2xl font-semibold`}>OAuth ID Token </h2>
                      <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
                        Print the OAuth ID Token. This token can be used to authenticate a user on the server.
                      </p>
                    </button>
                  </div>
                  <div className="overflow-scroll col-start-2 col-span-2 row-span-2 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    <div className="w-[1000px]">
                      <div className="block whitespace-pre-wrap justify-center ">
                        <pre>{events.join(`\n`)}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
