const LatticeToken = artifacts.require("LatticeToken");
const LatticeStakingPool = artifacts.require("LatticeStakingPool");

export default async (deployer: Truffle.Deployer) => {
  await deployer.deploy(LatticeToken);
  await deployer.deploy(LatticeStakingPool, LatticeToken.address);
};
