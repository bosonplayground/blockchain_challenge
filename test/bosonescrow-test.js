const { expect } = require("chai");
const { BigNumber } = require("ethers");
const hre = require("hardhat");
const { revertMessage, deployContracts } = require("../scripts/utils");
const ethers = hre.ethers;

let deployer, account1, account2, account3;
let deployerAddr, account1Addr, account2Addr, account3Addr;
let initialOwner;
let BosonToken;
const bosonTokenPrice = ethers.constants.WeiPerEther.div(100); // 0.01 ETH
let BosonEscrow;

async function initTestVariables() {
    [deployer, account1, account2, account3] = await ethers.getSigners();
    deployerAddr = await deployer.getAddress();
    account1Addr = await account1.getAddress();
    account2Addr = await account2.getAddress();
    account3Addr = await account3.getAddress();
    initialOwner = account1Addr;
}

async function createContract() {
    const contracts = await deployContracts({ 'BosonToken': [bosonTokenPrice], 'BosonEscrow': [] })
    BosonToken = contracts.bosonToken;
    BosonEscrow = contracts.bosonEscrow;
}

describe("BosonEscrow Deployment", async() => {
    before('', async() => {
        await initTestVariables();
    })
    it("Should verify that the escrow contract is deployed", async() => {
        await createContract();
        expect(BosonEscrow.address).to.not.equal('0x' + '0'.repeat(32));
    });
    it('Verify bosonToken address', async() => {
        expect(await BosonEscrow.tokenAddress()).to.equal(BosonToken.address);
    });
    it('User 1 credits his account with 5 tokens', async() => {
        const amount = 5;
        const expected_price = bosonTokenPrice.mul(amount * 1000000).div(1000000);
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        BosonToken.connect(account1).credit(amount_units, { value: expected_price, gasPrice: 0 });
        expect((await BosonToken.balanceOf(account1Addr)).gt(0)).to.be.true;
    });
    it('User 2 credits his account with 10 tokens', async() => {
        const amount = 10;
        const expected_price = bosonTokenPrice.mul(amount * 1000000).div(1000000);
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        BosonToken.connect(account2).credit(amount_units, { value: expected_price, gasPrice: 0 });
        expect((await BosonToken.balanceOf(account2Addr)).gt(0)).to.be.true;
    });
    it('User 2 places a payment of 6 tokens to escrow', async() => {
        const amount = 6;
        const balanceBefore = await BosonToken.balanceOf(account2Addr);
        const balanceEscrowBefore = await BosonToken.balanceOf(BosonEscrow.address);
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        expect(balanceBefore.gte(amount_units)).to.be.true;
        await BosonToken.connect(account2).approve(BosonEscrow.address, amount_units);
        await BosonEscrow.connect(deployer).placePayment(account2Addr, amount_units);
        expect((await BosonToken.balanceOf(account2Addr)).eq(balanceBefore.sub(amount_units))).to.be.true;
        expect((await BosonToken.balanceOf(BosonEscrow.address)).eq(balanceEscrowBefore.add(amount_units))).to.be.true;
    });
    it('User1 can not place a payment of 6 tokens because his balance is too low', async() => {
        const amount = 6;
        const balanceBefore = await BosonToken.balanceOf(account1Addr);
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        expect(balanceBefore.lt(amount_units)).to.be.true;
        await BosonToken.connect(account1).approve(BosonEscrow.address, amount_units);
        await expect(BosonEscrow.connect(deployer).placePayment(account1Addr, amount_units)).to.be.revertedWith(revertMessage('ERC20: transfer amount exceeds balance'));
        expect((await BosonToken.balanceOf(account1Addr)).eq(balanceBefore)).to.be.true;
    });
    it('User 1 places a payment of 5 tokens to escrow', async() => {
        const amount = 5;
        const balanceBefore = await BosonToken.balanceOf(account1Addr);
        const balanceEscrowBefore = await BosonToken.balanceOf(BosonEscrow.address);
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        expect(balanceBefore.gte(amount_units)).to.be.true;
        await BosonToken.connect(account1).approve(BosonEscrow.address, amount_units);
        await BosonEscrow.connect(deployer).placePayment(account1Addr, amount_units);
        expect((await BosonToken.balanceOf(account1Addr)).eq(balanceBefore.sub(amount_units))).to.be.true;
        expect((await BosonToken.balanceOf(BosonEscrow.address)).eq(balanceEscrowBefore.add(amount_units))).to.be.true;
    });
    it('User 2 can be refunded a payment of 4 tokens', async() => {
        const amount = 4;
        const balanceBefore = await BosonToken.balanceOf(account2Addr);
        const balanceEscrowBefore = await BosonToken.balanceOf(BosonEscrow.address);
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        expect(balanceBefore.gte(amount_units)).to.be.true;
        await BosonEscrow.connect(deployer).refund(account2Addr, amount_units);
        expect((await BosonToken.balanceOf(account2Addr)).eq(balanceBefore.add(amount_units))).to.be.true;
        expect((await BosonToken.balanceOf(BosonEscrow.address)).eq(balanceEscrowBefore.sub(amount_units))).to.be.true;
    });
    it('User 2 can get his balance in escrow', async() => {
        const amount = 2;
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        expect((await BosonEscrow.connect(account2).balanceOf(account2Addr)).eq(amount_units)).to.be.true;
    });
    it('User 1 can not get user 2 balance in escrow', async() => {
        const amount = 2;
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        await expect(BosonEscrow.connect(account1).balanceOf(account2Addr)).to.be.revertedWith(revertMessage('BosonEscrow: NOT AUTHORIZED'));
    });
    it('User 1 can not be refunded a payment of 6 tokens', async() => {
        const amount = 6;
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        expect((await BosonToken.balanceOf(BosonEscrow.address)).gt(amount_units)).to.be.true;
        expect((await BosonEscrow.connect(account1).balanceOf(account1Addr)).lt(amount_units)).to.be.true;
        await expect(BosonEscrow.connect(deployer).refund(account1Addr, amount_units)).to.be.revertedWith("BosonEscrow: escrow balance too low");
    });
    it('User 1 can confirm payment of 2 tokens', async() => {
        const balance3Before = await BosonToken.balanceOf(account3Addr);
        const escrowAccountBefore = await BosonEscrow.connect(account1).balanceOf(account1Addr);
        const amount = 2;
        const decimals = await BosonToken.decimals();
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        await BosonEscrow.connect(deployer).pay(account1Addr, account3Addr, amount_units);
        expect((await BosonToken.balanceOf(account3Addr)).eq(balance3Before.add(amount_units)));
        expect((await BosonEscrow.connect(account1).balanceOf(account1Addr)).eq(escrowAccountBefore.sub(amount_units)));

    })

});