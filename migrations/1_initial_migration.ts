const Migrations = artifacts.require("Migrations");

export default async (deployer: Truffle.Deployer) => {
  deployer.deploy(Migrations);
};
