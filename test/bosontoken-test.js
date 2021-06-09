const { expect } = require("chai");
const { BigNumber } = require("ethers");
const hre = require("hardhat");
const { revertMessage, deployContracts } = require("./../scripts/utils");
const ethers = hre.ethers;

let deployer, account1, account2;
let deployerAddr, account1Addr, account2Addr;
let initialOwner;
let BosonToken;
const tokenName = 'Boson Token';
const tokenSymbol = 'BTK';
const decimals = 18;
const bosonTokenPrice = ethers.constants.WeiPerEther.div(100); // 0.01 ETH

async function initTestVariables() {
    [deployer, account1, account2] = await ethers.getSigners();
    deployerAddr = await deployer.getAddress();
    account1Addr = await account1.getAddress();
    account2Addr = await account2.getAddress();
    initialOwner = account1Addr;
}

async function createContract() {
    const contracts = await deployContracts({ 'BosonToken': [bosonTokenPrice] })
    BosonToken = contracts.bosonToken;
}

describe("BosonToken Token Deployment", async() => {
    before('', async() => {
        await initTestVariables();
    })
    it("Should verify that the token contract is deployed", async() => {
        await createContract();
        expect(BosonToken.address).to.not.equal('0x' + '0'.repeat(32));
    });
    it('Verify name', async() => {
        expect(await BosonToken.name()).to.equal(tokenName);
    });
    it('Verify symbol', async() => {
        expect(await BosonToken.symbol()).to.equal(tokenSymbol);
    });
    it('Verify decimals', async() => {
        expect(await BosonToken.decimals()).to.equal(decimals);
    });
    it('Verify totalSupply', async() => {
        expect((await BosonToken.totalSupply()).eq(0)).to.be.true;
    });
    it('check compute price', async() => {
        const amount = 15.5;
        const expected_price = bosonTokenPrice.mul(amount * 1000000).div(1000000);
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        expect((await BosonToken.computePrice(amount_units)).eq(expected_price)).to.be.true;
    });

});

describe('Test BosonToken token standard ERC20 features', async() => {
    before('', async() => {
        await initTestVariables();
        await createContract();
    });
    beforeEach('update balances', async() => {
        balance1Before = await BosonToken.balanceOf(account1Addr);
        balance2Before = await BosonToken.balanceOf(account2Addr);
        balanceDeployerBefore = await BosonToken.balanceOf(deployerAddr);
        totalSupplyBefore = await BosonToken.totalSupply();
    });
    it('Verify initial balances', async() => {
        expect(balanceDeployerBefore.toNumber()).to.equal(0);
        expect(balance1Before.eq(0)).to.be.true;
        expect(balance2Before.eq(0)).to.be.true;
    });
    it('Verify account2 cant credit an amount of tokens if paying too low', async() => {
        const ethBalance2Before = await account2.getBalance();
        const amount = 15.5;
        const expected_price = BigNumber.from(12);
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        await expect(BosonToken.connect(account2).credit(amount_units, { value: expected_price, gasPrice: 0 })).to.be.revertedWith(revertMessage('BosonToken: Transaction payment is too low'));
    });
    it('Verify account2 credits an amount of tokens when paying the correct price', async() => {
        const totalSupplyBefore = await BosonToken.totalSupply();
        const ethBalance2Before = await account2.getBalance();
        const amount = 15.5;
        const expected_price = bosonTokenPrice.mul(amount * 1000000).div(1000000);
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        BosonToken.connect(account2).credit(amount_units, { value: expected_price, gasPrice: 0 });
        const ethBalance2After = await account2.getBalance();
        const BosonTokenBalanceAfter = await BosonToken.balanceOf(account2Addr);
        expect(ethBalance2After.eq(ethBalance2Before.sub(expected_price))).to.be.true;
        expect(BosonTokenBalanceAfter.eq(balance2Before.add(amount_units))).to.be.true;
        const totalSupplyAfter = await BosonToken.totalSupply();
        expect(totalSupplyAfter.sub(totalSupplyBefore).eq(amount_units)).to.be.true;
    });

    it('Verify transfer 2 -> 1', async() => {
        const amount = 10;
        const amount_units = BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
        await BosonToken.connect(account2).transfer(account1Addr, amount_units);
        expect((await BosonToken.balanceOf(account2Addr)).eq(balance2Before.sub(amount_units))).to.be.true;
        expect((await BosonToken.balanceOf(account1Addr)).eq(balance1Before.add(amount_units))).to.be.true;
        expect((await BosonToken.totalSupply()).eq(totalSupplyBefore)).to.be.true;
    });
    it('Verify transfer requires funds', async() => {
        await expect(BosonToken.connect(account2).transfer(account1Addr, balance2Before.add(1))).to.be.revertedWith(revertMessage('ERC20: transfer amount exceeds balance'));
        expect((await BosonToken.balanceOf(account2Addr)).toString()).to.equal(balance2Before.toString());
    });
    it('Verify approve allow so to transfer funds from another account', async() => {
        const amount = 100;
        await BosonToken.connect(account1).approve(account2Addr, amount);
        expect((await BosonToken.allowance(account1Addr, account2Addr)).toString()).to.equal(amount.toString());
        await BosonToken.connect(account2).transferFrom(account1Addr, account2Addr, amount);
        expect((await BosonToken.allowance(account1Addr, account2Addr)).toNumber()).to.equal(0);
    });
    it('Verify insufficient allowance does not allow so to transfer funds from another account', async() => {
        const amount = 100;
        await BosonToken.connect(account1).approve(account2Addr, amount - 1);
        expect((await BosonToken.allowance(account1Addr, account2Addr)).lt(amount)).to.be.true;
        await expect(BosonToken.connect(account2).transferFrom(account1Addr, account2Addr, amount)).to.be.revertedWith(revertMessage('ERC20: transfer amount exceeds allowance'));
        expect((await BosonToken.allowance(account1Addr, account2Addr)).eq(amount - 1)).to.be.true;
    });
    xit('Verify reset set all balances to 0', async() => {
        expect((await BosonToken.balanceOf(account1Addr)).gt(0)).to.be.true;
        expect((await BosonToken.balanceOf(account2Addr)).gt(0)).to.be.true;
        expect((await BosonToken.totalSupply()).gt(0)).to.be.true;
        await BosonToken.reset();
        expect((await BosonToken.balanceOf(account1Addr)).eq(0)).to.be.true;
        expect((await BosonToken.balanceOf(account2Addr)).eq(0)).to.be.true;
        expect((await BosonToken.totalSupply()).eq(0)).to.be.true;
    });

});

describe('BosonToken Ownership', async() => {
    before('', async() => {
        await initTestVariables();
        await createContract();
    });
    it('Verify initial owner', async() => {
        expect(await BosonToken.owner()).to.equal(deployerAddr);
    });
    it('The owner can transfer the contract ownership to another account', async() => {
        await BosonToken.connect(deployer).transferOwnership(account1Addr);
        expect(await BosonToken.owner()).to.equal(account1Addr);
    });
    it('Another user cannot transfer the contract ownership to another account', async() => {
        await expect(BosonToken.connect(deployer).transferOwnership(account2Addr)).to.be.revertedWith(revertMessage('Ownable: caller is not the owner'));
    });
});