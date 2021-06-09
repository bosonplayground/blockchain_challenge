const { deployContract } = require("ethereum-waffle");
const { ethers } = require("hardhat");

function revertMessage(error) {
    return 'VM Exception while processing transaction: revert ' + error;
}

function getBalanceAsNumber(bn, decimals, accuracy) {
    const r1 = ethers.BigNumber.from(10).pow(decimals - accuracy);
    const r2 = bn.div(r1);
    const r3 = r2.toNumber();
    const r4 = r3 / (10 ** accuracy);
    return r4;
}

async function deployContracts(args = undefined) {

    let bosonToken, bosonEscrow, bosonMarket;

    params = [];
    if (args && args.BosonToken) {
        params = args.BosonToken;
        const BosonToken = await hre.ethers.getContractFactory("BosonToken");
        bosonToken = await BosonToken.deploy(...params);
        await bosonToken.deployed();
    }

    params = [];
    if (args && args.BosonEscrow) {
        params = args.BosonEscrow;
        const BosonEscrow = await hre.ethers.getContractFactory("BosonEscrow");
        bosonEscrow = await BosonEscrow.deploy(bosonToken.address, ...params);
        await bosonEscrow.deployed();
    }

    params = [];
    if (args && args.BosonMarket) {
        params = args.BosonMarket;
        const BosonMarket = await hre.ethers.getContractFactory("BosonMarket");
        bosonMarket = await BosonMarket.deploy(bosonEscrow.address, ...params);
        await bosonMarket.deployed();
        if (args.BosonEscrow) {
            await bosonEscrow.transferOwnership(bosonMarket.address);
        }
    }

    return { bosonToken, bosonEscrow, bosonMarket };
}


module.exports = {
    revertMessage,
    getBalanceAsNumber,
    deployContracts
}