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
let BosonMarket;

const ITEM_DATAS = {
    title: 0,
    price: 1,
    availableQuantity: 2,
    orderedQuantity: 3,
    seller: 4
}

const ORDER_DATAS = {
    status: 0,
    buyer: 1,
    itemIds: 2,
    quantities: 3
}

const ORDER_STATUS = {
    Ordered: 0,
    Completed: 1,
    Complained: 2
}

async function initTestVariables() {
    [deployer, account1, account2, account3] = await ethers.getSigners();
    deployerAddr = await deployer.getAddress();
    account1Addr = await account1.getAddress();
    account2Addr = await account2.getAddress();
    account3Addr = await account3.getAddress();
    initialOwner = account1Addr;
}

async function createContract() {
    const contracts = await deployContracts({ 'BosonToken': [bosonTokenPrice], 'BosonEscrow': [], 'BosonMarket': [] })
    BosonToken = contracts.bosonToken;
    BosonEscrow = contracts.bosonEscrow;
    BosonMarket = contracts.bosonMarket;
}

describe("BosonMarket Deployment", async() => {
    before('', async() => {
        await initTestVariables();
    })
    it("Should verify that the market contract is deployed", async() => {
        await createContract();
        expect(BosonMarket.address).to.not.equal('0x' + '0'.repeat(32));
    });
    it('Verify bosonEscrow address', async() => {
        expect(await BosonMarket.escrowAddress()).to.equal(BosonEscrow.address);
    });
    it('Verify the owner of bosonEscrow is the market contract', async() => {
        expect(await BosonEscrow.owner()).to.equal(BosonMarket.address);
    });

});

async function convert_amount(amount) {
    const decimals = await BosonToken.decimals();
    return BigNumber.from(10).pow(decimals).mul(amount * 1000000).div(1000000);
}

describe('BosonMarket Offer items for sale', async() => {
    before('', async() => {
        await initTestVariables();
    })
    it("Should verify that the market contract is deployed", async() => {
        await createContract();
        expect(BosonMarket.address).to.not.equal('0x' + '0'.repeat(32));
    });
    it('User 1 can offer an item for sale', async() => {
        const nbItems = await BosonMarket.nbItems();
        const title = "T-Shirt";
        const price = 20.5;
        const quantity = 1;
        const price_units = await convert_amount(price);
        const p = new Promise(async(resolve, reject) => {
            await BosonMarket.connect(account1).offerItem(ethers.utils.formatBytes32String(title), price_units, quantity);
            let filter = BosonMarket.filters.OnNewItem(null, account1Addr);
            BosonMarket.once(filter, async(itemId, seller, title, price, quantity) => {
                resolve({ itemId, seller, title, price, quantity });
            })
        });
        const eventData = await p;
        expect(eventData.itemId.eq(nbItems)).to.be.true;
        expect(eventData.seller).to.equal(account1Addr);
        const eventTitle = ethers.utils.parseBytes32String(eventData.title);
        expect(eventTitle).to.equal(title);
        expect((await BosonMarket.nbItems()).eq(nbItems.add(1))).to.be.true;
    })
    it('User 2 can offer 2 items Coffee for sale', async() => {
        const nbItems = await BosonMarket.nbItems();
        const title = "Coffee";
        const price = 1.5;
        const quantity = 2;
        const title_b32 = ethers.utils.formatBytes32String(title);
        const price_units = await convert_amount(price);
        expect(await BosonMarket.connect(account2).offerItem(title_b32, price_units, quantity))
            .to.emit(BosonMarket, 'OnNewItem').withArgs(nbItems.toString(), account2Addr, title_b32, price_units.toString(), quantity);
        expect((await BosonMarket.nbItems()).eq(nbItems.add(1))).to.be.true;
    })
    it('List all items on sale', async() => {
        const nbItems = await BosonMarket.nbItems();
        expect(nbItems.eq(2)).to.be.true;
        const sellers = [
            account1Addr, account2Addr
        ];
        for (let i = 0; i < nbItems.toNumber(); i++) {
            const itemData = await BosonMarket.itemDatas(i);
            expect(itemData.length).to.equal(5);
            expect(itemData[ITEM_DATAS.seller]).to.equal(sellers[i]);
        }
    })

})

const items = [{
        title: 'T-Shirt',
        price: 20.5,
        quantity: 1
    },
    {
        title: 'Coffee',
        price: 1.5,
        quantity: 2
    }
];

describe('BosonMarket order items, complete and complain', async() => {
    before('', async() => {
        await initTestVariables();
    })
    it("Should verify that the market contract is deployed", async() => {
        await createContract();
        expect(BosonMarket.address).to.not.equal('0x' + '0'.repeat(32));
    });
    it('User 1 can offer an item for sale', async() => {
        const nbItems = await BosonMarket.nbItems();
        const title = items[0].title;
        const price = items[0].price;
        const quantity = items[0].quantity;
        const title_b32 = ethers.utils.formatBytes32String(title);
        const price_units = await convert_amount(price);
        await BosonMarket.connect(account1).offerItem(title_b32, price_units, quantity);
        expect((await BosonMarket.nbItems()).eq(nbItems.add(1))).to.be.true;
    })
    it('User 2 can offer 2 items Coffee for sale', async() => {
        const nbItems = await BosonMarket.nbItems();
        const title = items[1].title;
        const price = items[1].price;
        const quantity = items[1].quantity;
        const title_b32 = ethers.utils.formatBytes32String(title);
        const price_units = await convert_amount(price);
        await BosonMarket.connect(account2).offerItem(title_b32, price_units, quantity);
        expect((await BosonMarket.nbItems()).eq(nbItems.add(1))).to.be.true;
    })
    it('User 3 can not order an item because he has no credit', async() => {
        const nbOrders = await BosonMarket.nbOrders();
        const itemId = 0;
        const quantity = 1;
        await expect(BosonMarket.connect(account3).order([itemId], [quantity])).to.be.revertedWith(revertMessage("ERC20: transfer amount exceeds balance"));
        expect((await BosonMarket.nbOrders()).eq(nbOrders)).to.be.true;
    })
    it('User 3 credits an amount of tokens', async() => {
        const amount = 22.5;
        const expected_price = bosonTokenPrice.mul(amount * 1000000).div(1000000);
        const amount_units = await convert_amount(amount);
        await BosonToken.connect(account3).credit(amount_units, { value: expected_price, gasPrice: 0 });
        expect((await BosonToken.balanceOf(account3Addr)).eq(amount_units)).to.be.true;
    });
    it('User 3 can order an item now because he has enough credit', async() => {
        const nbOrders = await BosonMarket.nbOrders();
        const itemId = 0;
        const itemDataBefore = await BosonMarket.itemDatas(itemId);
        const availableQuantity = itemDataBefore[ITEM_DATAS.availableQuantity];
        const orderedQuantity = itemDataBefore[ITEM_DATAS.orderedQuantity];
        const quantity = 1;
        const totalPrice = await BosonMarket.computePrice([itemId], [quantity]);
        await BosonToken.connect(account3).approve(BosonEscrow.address, totalPrice);
        expect(await BosonMarket.connect(account3).order([itemId], [quantity]))
            .to.emit(BosonMarket, 'OnNewOrder').withArgs(nbOrders, account3Addr);
        expect((await BosonMarket.nbOrders()).eq(nbOrders.add(1))).to.be.true;
        const itemDataAfter = await BosonMarket.itemDatas(itemId);
        expect(itemDataAfter[ITEM_DATAS.availableQuantity]).to.equal(availableQuantity - quantity);
        expect(itemDataAfter[ITEM_DATAS.orderedQuantity]).to.equal(orderedQuantity + quantity);
    });
    it('User 3 can not order 2 items because he has not enough credit', async() => {
        const itemId = 1;
        const quantity = 2;
        const nbOrders = await BosonMarket.nbOrders();
        const totalPrice = await BosonMarket.computePrice([itemId], [quantity]);
        expect((await BosonToken.balanceOf(account3Addr)).lt(totalPrice)).to.be.true;
        await BosonToken.connect(account3).approve(BosonEscrow.address, totalPrice);
        await expect(BosonMarket.connect(account3).order([itemId], [quantity])).to.be.revertedWith(revertMessage('ERC20: transfer amount exceeds balance'));
        expect((await BosonMarket.nbOrders()).eq(nbOrders)).to.be.true;
    });
    it('User 3 credits again an amount of tokens', async() => {
        const amount = 1;
        const balance3Before = await BosonToken.balanceOf(account3Addr);
        const expected_price = bosonTokenPrice.mul(amount * 1000000).div(1000000);
        const amount_units = await convert_amount(amount);
        await BosonToken.connect(account3).credit(amount_units, { value: expected_price, gasPrice: 0 });
        expect((await BosonToken.balanceOf(account3Addr)).eq(balance3Before.add(amount_units))).to.be.true;
    });
    it('User 3 can order 2 items now because he has enough credit', async() => {
        const nbOrders = await BosonMarket.nbOrders();
        const itemId = 1;
        const itemDataBefore = await BosonMarket.itemDatas(itemId);
        const availableQuantity = itemDataBefore[ITEM_DATAS.availableQuantity];
        const orderedQuantity = itemDataBefore[ITEM_DATAS.orderedQuantity];
        const quantity = 2;
        const totalPrice = await BosonMarket.computePrice([itemId], [quantity]);
        await BosonToken.connect(account3).approve(BosonEscrow.address, totalPrice);
        expect(await BosonMarket.connect(account3).order([itemId], [quantity]))
            .to.emit(BosonMarket, 'OnNewOrder').withArgs(nbOrders, account3Addr);
        expect((await BosonMarket.nbOrders()).eq(nbOrders.add(1))).to.be.true;
        const itemDataAfter = await BosonMarket.itemDatas(itemId);
        expect(itemDataAfter[ITEM_DATAS.availableQuantity]).to.equal(availableQuantity - quantity);
        expect(itemDataAfter[ITEM_DATAS.orderedQuantity]).to.equal(orderedQuantity + quantity);
    });
    it('User 2 can not complete an order he has not created', async() => {
        const orderId = 0;
        await expect(BosonMarket.connect(account2).complete(orderId)).to.be.revertedWith(revertMessage('BosonMarket: NOT AUTHORIZED'));
    });
    it('User 3 can complete an order he has created', async() => {
        const orderIds = await BosonMarket.connect(account3).getMyOrders();
        expect(orderIds.length).to.equal(2);
        const orderId = orderIds[0];
        const orderData = await BosonMarket.connect(account3).getOrderData(orderId);
        expect(orderData.length).to.equal(4);
        const itemIds = orderData[ORDER_DATAS.itemIds];
        const orderPrice = await BosonMarket.computePrice(orderData[ORDER_DATAS.itemIds], orderData[ORDER_DATAS.quantities]);
        expect(itemIds.length).to.equal(1);
        expect(orderData[ORDER_DATAS.status]).to.equal(ORDER_STATUS.Ordered);
        const itemData = await BosonMarket.itemDatas(itemIds[0]);
        const seller = itemData[ITEM_DATAS.seller];
        const sellerBalanceBefore = await BosonToken.balanceOf(seller);
        const escrowBalanceBefore = await BosonToken.balanceOf(BosonEscrow.address);
        await BosonMarket.connect(account3).complete(orderId);
        expect((await BosonToken.balanceOf(seller)).eq(sellerBalanceBefore.add(orderPrice)));
        expect((await BosonToken.balanceOf(BosonEscrow.address)).eq(escrowBalanceBefore.sub(orderPrice)));
        const orderDataAfter = await BosonMarket.connect(account3).getOrderData(orderId);
        expect(orderDataAfter[ORDER_DATAS.status]).to.equal(ORDER_STATUS.Completed);
    });
    it('User 3 can not complete an order he has already completed', async() => {
        const orderIds = await BosonMarket.connect(account3).getMyOrders();
        expect(orderIds.length).to.equal(2);
        const orderId = orderIds[0];
        await expect(BosonMarket.connect(account3).complete(orderId)).to.be.revertedWith(revertMessage('BosonMarket: Invalid Order State'));
    });
    it('User 1 can not complain an order he has not created', async() => {
        const orderId = 1;
        await expect(BosonMarket.connect(account1).complain(orderId)).to.be.revertedWith(revertMessage('BosonMarket: NOT AUTHORIZED'));
    });
    it('User 3 can complain an order he has created', async() => {
        const orderIds = await BosonMarket.connect(account3).getMyOrders();
        expect(orderIds.length).to.equal(2);
        const orderId = orderIds[1];
        const orderData = await BosonMarket.connect(account3).getOrderData(orderId);
        expect(orderData.length).to.equal(4);
        const itemIds = orderData[ORDER_DATAS.itemIds];
        const orderPrice = await BosonMarket.computePrice(orderData[ORDER_DATAS.itemIds], orderData[ORDER_DATAS.quantities]);
        expect(itemIds.length).to.equal(1);
        expect(orderData[ORDER_DATAS.status]).to.equal(ORDER_STATUS.Ordered);
        const itemData = await BosonMarket.itemDatas(itemIds[0]);
        const buyer = orderData[ORDER_DATAS.buyer];
        expect(buyer).to.equal(account3Addr);
        const buyerBalanceBefore = await BosonToken.balanceOf(buyer);
        const escrowBalanceBefore = await BosonToken.balanceOf(BosonEscrow.address);
        await BosonMarket.connect(account3).complain(orderId);
        expect((await BosonToken.balanceOf(buyer)).eq(buyerBalanceBefore.add(orderPrice)));
        expect((await BosonToken.balanceOf(BosonEscrow.address)).eq(escrowBalanceBefore.sub(orderPrice)));
        const orderDataAfter = await BosonMarket.connect(account3).getOrderData(orderId);
        expect(orderDataAfter[ORDER_DATAS.status]).to.equal(ORDER_STATUS.Complained);
    });
    it('User 3 can not complain an order he has already completed', async() => {
        const orderIds = await BosonMarket.connect(account3).getMyOrders();
        expect(orderIds.length).to.equal(2);
        const orderId = orderIds[0];
        const orderData = await BosonMarket.connect(account3).getOrderData(orderId);
        expect(orderData[ORDER_DATAS.status]).to.equal(ORDER_STATUS.Completed);
        await expect(BosonMarket.connect(account3).complain(orderId)).to.be.revertedWith(revertMessage('BosonMarket: Invalid Order State'));
    });
    it('User 3 can not complain an order he has already complained', async() => {
        const orderIds = await BosonMarket.connect(account3).getMyOrders();
        expect(orderIds.length).to.equal(2);
        const orderId = orderIds[1];
        const orderData = await BosonMarket.connect(account3).getOrderData(orderId);
        expect(orderData[ORDER_DATAS.status]).to.equal(ORDER_STATUS.Complained);
        await expect(BosonMarket.connect(account3).complain(orderId)).to.be.revertedWith(revertMessage('BosonMarket: Invalid Order State'));
    });
    it('User 3 can not complete an order he has already complained', async() => {
        const orderIds = await BosonMarket.connect(account3).getMyOrders();
        expect(orderIds.length).to.equal(2);
        const orderId = orderIds[1];
        const orderData = await BosonMarket.connect(account3).getOrderData(orderId);
        expect(orderData[ORDER_DATAS.status]).to.equal(ORDER_STATUS.Complained);
        await expect(BosonMarket.connect(account3).complete(orderId)).to.be.revertedWith(revertMessage('BosonMarket: Invalid Order State'));
    });
    xit('Verify reset', async() => {
        expect((await BosonToken.balanceOf(account1Addr)).gt(0)).to.be.true;
        expect((await BosonToken.balanceOf(account3Addr)).gt(0)).to.be.true;
        expect((await BosonToken.totalSupply()).gt(0)).to.be.true;
        expect((await BosonMarket.nbOrders()).gt(0)).to.be.true;
        expect((await BosonMarket.nbItems()).gt(0)).to.be.true;
        await BosonMarket.reset();
        await BosonToken.reset();
        expect((await BosonToken.balanceOf(account1Addr)).eq(0)).to.be.true;
        expect((await BosonToken.balanceOf(account3Addr)).eq(0)).to.be.true;
        expect((await BosonToken.totalSupply()).eq(0)).to.be.true;
        expect((await BosonMarket.nbOrders()).eq(0)).to.be.true;
        expect((await BosonMarket.nbItems()).eq(0)).to.be.true;
    });



})
