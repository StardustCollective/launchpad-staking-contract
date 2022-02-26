# Lattice Launchpad - Staking Contract

[![Feature Branch Build](https://github.com/StardustCollective/launchpad-staking-contract/actions/workflows/feature_branch.yml/badge.svg)](https://github.com/StardustCollective/launchpad-staking-contract/actions/workflows/feature_branch.yml) [![Software License](https://img.shields.io/badge/license-UNLICENSED-orange.svg)](package.json)


## Getting Started

This project was built using `Node 12`, `Solidity 0.8.11`, `Hardhat 2.8` and `TypeScript 4.5`, to start you can install the project dependencies using `yarn`.

```
$ yarn install
```

## Harhat and Contract Development

For Ethereum Contract Development we decided to use Hardhat as our tool for development and testing purposes as it offers out-of-the-box support for TypeScript, as well decided to use the [`typechain`](https://github.com/dethcrypto/TypeChain) package to generate static typing for contract ABIs.

### Development

The Hardhat Runtime Environment provides easy integration with different plugins you may use, in general terms is up to you how you want to develop using hardhat. Out-of-the-box support for different core tasks like testing and deploying are available.

You can check the hardhat docs for more info.
https://hardhat.org/getting-started/

### Tests & Coverage

Hardhat has out-of-the-box tests with Mocha-Chai and Waffle. As well provides code coverage.

You can run tests using
```
$ yarn test
```

and run coverage reports using
```
$ yarn coverage
```

### Compile
For building contracts and generate types you can use.

```
$ yarn build
```

Compiled contracts will be stored in the [artifacts](artifacts/) folder and generated types in the [typechain-types](typechain-types/).

You can start using contract types right away by importing types from [typechain-types](typechain-types/) or using the HRE function `ethers.getContractFactory(contractName: string)`.

## License

For now this project is unlicensed