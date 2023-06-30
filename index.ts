import { config } from "dotenv";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { readFileSync } from "fs";
import { Goerli } from "@thirdweb-dev/chains";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import {
  SmartWallet,
  SmartWalletConfig,
  getAllSmartWallets,
  isSmartWalletDeployed,
} from "@thirdweb-dev/wallets";

config();

const chain = Mumbai;
const factoryAddress = "0xf14C4Bc3318d6879Ba973eA8BcC8851a46811aA2";
const thirdwebApiKey = process.env.THIRDWEB_API_KEY as string;

const main = async () => {
  if (!thirdwebApiKey) {
    throw new Error(
      "No API Key found, get one from https://thirdweb.com/dashboard"
    );
  }
  console.log("Running on", chain.slug, "with factory", factoryAddress);

  // Load or create personal wallet
  // here we generate LocalWallet that will be stored in wallet.json
  const personalWallet = new LocalWalletNode();
  await personalWallet.loadOrCreate({
    strategy: "mnemonic",
    encryption: false,
  });
  const personalWalletAddress = await personalWallet.getAddress();
  console.log("Personal wallet address:", personalWalletAddress);

  // Configure the smart wallet
  const config: SmartWalletConfig = {
    chain,
    factoryAddress,
    thirdwebApiKey,
    gasless: true,
  };

  // [Optional] get all the smart wallets associated with the personal wallet
  const accounts = await getAllSmartWallets(
    chain,
    factoryAddress,
    personalWalletAddress
  );
  console.log(`Associated smart wallets for personal wallet`, accounts);

  // [Optional] check if the smart wallet is deployed for the personal wallet
  const isWalletDeployed = await isSmartWalletDeployed(
    chain,
    factoryAddress,
    personalWalletAddress
  );
  console.log(`Is smart wallet deployed?`, isWalletDeployed);

  // Connect the smart wallet
  const smartWallet = new SmartWallet(config);
  await smartWallet.connect({
    personalWallet,
  });

  // now use the SDK normally to perform transactions with the smart wallet
  const sdk = await ThirdwebSDK.fromWallet(smartWallet, chain);

  console.log("Smart Account addr:", await sdk.wallet.getAddress());
  console.log("balance:", (await sdk.wallet.balance()).displayValue);

  // Claim a ERC20 token
  const contract = await sdk.getContract(
    "0x52f98feE8D7A5f3045906fBD6d801BB93Ed250E7" // TokenDrop on mumbai
  );
  const tokenBalance = await contract.erc20.balance();
  console.log("ERC20 token balance:", tokenBalance.displayValue);
  const tx = await contract.erc20.claim(1);
  console.log("Claimed 1 ERC20 token, tx hash:", tx.receipt.transactionHash);
};

main();
