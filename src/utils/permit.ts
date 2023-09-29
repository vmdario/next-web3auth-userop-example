import { ethers } from "ethers";

type Address = string;
type int64 = ethers.BigNumberish;

export async function generateSignedPermit(
  contractName: string,
  contractVersion: string,
  legacyPermit: boolean,
  owner: Address,
  spender: Address,
  verifyingContract: Address,
  chainId: int64,
  value: int64,
  nonce: int64,
  deadline: int64,
  privateKey: string
) {
  let domain: ethers.TypedDataDomain;
  let types: { [s: string]: ethers.TypedDataField[] };

  if (!legacyPermit) {
    domain = {
      name: contractName,
      version: contractVersion,
      chainId: ethers.toBeHex(chainId.toString()),
      verifyingContract: verifyingContract,
    };
    types = {
      // EIP712Domain: [
      //   { name: "name", type: "string" },
      //   { name: "version", type: "string" },
      //   { name: "chainId", type: "uint256" },
      //   { name: "verifyingContract", type: "address" },
      // ],
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };
  } else {
    domain = {
      name: contractName,
      version: contractVersion,
      salt: ethers.keccak256(ethers.toBeHex(chainId.toString())),
      verifyingContract: verifyingContract,
    };
    types = {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "verifyingContract", type: "address" },
        { name: "salt", type: "bytes32" },
      ],
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };
  }

  const wallet = new ethers.Wallet(privateKey);
  console.log(wallet.address, domain, types);
  const signature = await wallet.signTypedData(domain, types, {
    owner: owner,
    spender: spender,
    value: ethers.toBeHex(value.toString()),
    nonce: ethers.toBeHex(nonce.toString()),
    deadline: ethers.toBeHex(deadline.toString()),
  });

  return ethers.Signature.from(signature);
}
