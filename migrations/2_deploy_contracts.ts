type Network = "development" | "kovan" | "mainnet";

export default (artifacts: Truffle.Artifacts, web3: Web3) =>
  async (
    deployer: Truffle.Deployer,
    network: Network,
    accounts: Truffle.Accounts
  ) => {
    const LatticeToken = artifacts.require("LatticeToken");
    const LatticeStakingPool = artifacts.require("LatticeStakingPool");

    await deployer.deploy(LatticeToken);
    await deployer.deploy(LatticeStakingPool, LatticeToken.address);
  };
