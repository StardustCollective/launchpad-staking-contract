# Lattice Launchpad - Staking Contract

[![Feature Branch Build](https://github.com/StardustCollective/launchpad-staking-contract/actions/workflows/feature_branch.yml/badge.svg)](https://github.com/StardustCollective/launchpad-staking-contract/actions/workflows/feature_branch.yml) [![Software License](https://img.shields.io/badge/license-UNLICENSED-orange.svg)](package.json)


## Getting Started

This project was built using `Node 12`, `Solidity 0.8.11`, `Truffle 5.4` and `Typescript 4.5`, to start you can install the project dependencies using `yarn`.

```
$ yarn install
```

## Truffle and Contract Development

For Ethereum Contract Development we decided to use Truffle as our main tool for development and testing purposes, as well decided to use the [`typechain`](https://github.com/dethcrypto/TypeChain) package to generate static typing for contract ABIs.

### Development

You can start right away by using the Truffle develop console the following way.

```
$ yarn truffle develop
```

You can find more details about the console [here](https://trufflesuite.com/docs/truffle/getting-started/using-truffle-develop-and-the-console) and available Truffle commands [here](https://trufflesuite.com/docs/truffle/reference/truffle-commands.html).

### Tests

For testing, Truffle comes integrated with Mocha-Chai tests, so you can start writting and running tests pretty easily.

```
$ yarn test
```

Differences between normal JavaScript tests and Truffle tests are basically one. You would use `contract()` instead of `describe()`, this will deploy a fresh contract over the test network for every `contract()` call found. Neveretheless you can use `describe()` to structure your tests. More details about Truffle testing can be found [here](https://trufflesuite.com/docs/truffle/testing/testing-your-contracts.html).

Ohh ps: you can write as well tests using solidity =)

### Build

For building contracts and generate types you can use.

```
$ yarn build
```

Compiled contracts will be stored in the [build](build/) folder and generated types in the [types/truffle-contracts](types/truffle-contracts/).

You can start using contract types right away by importing types from [types/truffle-contracts](types/truffle-contracts/) or using the `artifact.require(contractName: string)` function.

## License

For now this project is unlicensed
