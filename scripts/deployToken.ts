import { ethers, network } from "hardhat";

async function main() {
  const accounts = await ethers.getSigners();

  if (network.name === "localhost") {
    await ethers.provider.send("hardhat_setBalance", [
      accounts[0].address,
      ethers.utils.parseUnits("1000", "ether").toHexString(),
    ]);
  }

  console.log(`Network Name: ${network.name}`);
  console.log(`Signer Address: ${accounts[0].address}`);

  const LatticeTokenFactory = await ethers.getContractFactory("LatticeToken");
  const contract = await LatticeTokenFactory.deploy();

  console.log(`Waiting for transaction: ${contract.deployTransaction.hash}`);

  await contract.deployed();

  console.log("LatticeToken deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
