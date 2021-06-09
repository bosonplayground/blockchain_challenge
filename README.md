# Boson Exercise Smart Contracts

The smart contracts implementation and test, built with Hardhat.

## Architecture & Design

The project is composed of 3 smart contracts

### BosonToken

An ERC20 compatible token contract, used as a currency to sell and buy items.

[BosonToken interface](./contracts/BosonToken.md)

### BosonEscrow

A contract that is used to hold some amounts of Boson tokens on behalf of the buyers in the process of completing a transaction 

[BosonEscrow interface](./contracts/BosonEscrow.md)


### BosonMarket

The contract used by the users *Sellers* and *Buyers* to perform the different features like *offering items*, *ordering*, *completing orders* or *complaining orders* .

[BosonMarket interface](./contracts/BosonMarket.md)

## Installation

***Prerequisite***:

- you need to have installed the following tools on your workstation:
  - [Node.JS and NPM](https://nodejs.org/en/download/)
  - [Ganache](https://www.trufflesuite.com/ganache)
- you need to set up a file .env at the root of the project, containing the following variables
  - MNEMONIC: the 12 words defining the wallet you're using to deploy your contract (**must be consistent with your ganache configuration**)
  - INFURA_API_KEY: your key on [INFURA](https://infura.io) used to deploy on Ethereum networks (mainnet or testnets).
  - Example:
  ```
  MNEMONIC=here is where your twelve words mnemonic should be put my friend
  INFURA_API_KEY=zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
  ```

***Then run:***

```
npm install
```

## Build

```
npm run build
```

## Test

```
npm run test
```

## Deploy

### Deploy on Ganache

***Configuration Check***

- please check that your Ganache configuration is consistent with the network configuration in [./hardhat.config.js](./hardhat.config.js).
Example:
  ```
  module.exports = {
  ...
    networks: {
        ganache: {
            chainId: 1337,
            url: "http://127.0.0.1:7545",
  ...
  ```

***Then run:***

```
npm run deploy -- --network ganache
```

### Deploy on another blockchain (ex: goerli)

***Configuration Check***

- please check or add the appropriate configuration for our network in [./hardhat.config.js](./hardhat.config.js), specifying:
  - a network tag (ex: 'goerli')
  - the network chainId
  - the url to the RPC node
  - the account mnemonics, and optionally scheme

  Example:
  ```
  module.exports = {
  ...
    networks: {
        goerli: {
            chainId: 5,
            url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
            accounts: {
                count: 10,
                initialIndex: 0,
                mnemonic: process.env.MNEMONIC,
                path: "m/44'/60'/0'/0",
            },
        },
  ...
  ```

***Then run:***

```
npm run deploy -- --network goerli
```
