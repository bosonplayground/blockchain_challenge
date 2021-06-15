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

## Instructions

Challenge instructions are given in a separate document. Please refer to that document.