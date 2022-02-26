import { ethers, network } from "hardhat";

async function main() {
  const accounts = await ethers.getSigners();

  if (network.name === "localhost") {
    await ethers.provider.send("hardhat_setBalance", [
      accounts[0].address,
      ethers.utils.parseUnits("1000", "ether").toHexString(),
    ]);
  }

  const latticeEnvVarName = `${network.name.toLocaleUpperCase()}_LATTICE_TOKEN`;
  const latticeTokenAddress = process.env[latticeEnvVarName];
  if (!latticeTokenAddress) {
    throw new Error(`Unable to find env variable ${latticeEnvVarName}`);
  }

  console.log(`Network Name: ${network.name}`);
  console.log(`Lattice Token Address: ${latticeTokenAddress}`);
  console.log(`Signer Address: ${accounts[0].address}`);

  const LatticeStakingPoolFactory = await ethers.getContractFactory(
    "LatticeStakingPool"
  );
  const contract = await LatticeStakingPoolFactory.deploy(latticeTokenAddress);

  console.log(`Waiting for transaction: ${contract.deployTransaction.hash}`);

  await contract.deployed();

  console.log("LatticeStakingPool deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
