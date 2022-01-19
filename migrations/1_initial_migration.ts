type Network = "development" | "kovan" | "mainnet";

export default (artifacts: Truffle.Artifacts, web3: Web3) =>
  async (deployer: Truffle.Deployer, network: Network, accounts: Truffle.Accounts) => {
    const Migrations = artifacts.require("Migrations");
    await deployer.deploy(Migrations);
  };
