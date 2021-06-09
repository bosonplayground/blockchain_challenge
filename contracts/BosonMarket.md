## contracts/BosonMarket.sol

# BosonMarket

BosonToken Token implementation.

## constructor nonpayable (address)

## Parameters

```
address _escrowAddress
```
## Events

## OnNewItem (uint256,address,bytes32,uint256,uint32)

## Parameters

```
uint256 itemId
address seller
bytes32 title
uint256 price
uint32 quantity
```
## OnNewOrder (uint256,address)

## Parameters

```
uint256 orderId
address buyer
```
## OwnershipTransferred (address,address)

## Parameters

```
address previousOwner
address newOwner
```
## Methods

## complain nonpayable (uint256)

```
Complain for the order referenced by the given orderId Requirements: - the
order must not have been completed or complained before - the caller is the
same account that has created this order
```
## Parameters

```
uint256 orderId
```
## complete nonpayable (uint256)

```
Complete the order referenced by the given orderId Requirements: - the order
must not have been completed or complained before - the caller is the same
account that has created this order
```
## Parameters

```
uint256 orderId
```
## computePrice view (uint256[],uint32[])

```
Gets the requested price for ordering the specified set of items, given a
quantity for each of them
```
## Parameters

```
uint256[] itemIds
uint32[] quantities
```
## Return Values

```
uint256 totalPrice
```
## escrowAddress view ()

## Return Values

```
address _
```
## getMyOrders view ()

```
Gets the ids of all orders made by the caller
```
## Return Values

```
uint256[] _orderIds
```
## getOrderData view (uint256)

```
Gets the data of the order referenced by the given orderId Requirements: -
the caller is the same account that has created this order or the caller is
the current contract's owner
```
## Parameters

```
uint256 orderId
```
## Return Values

```
uint8 status
address buyer
uint256[] itemIds
uint32[] quantities
```
## itemDatas view (uint256)

## Parameters

```
uint256 _
```
## Return Values

```
bytes32 title
uint256 price
uint32 availableQuantity
uint32 orderedQuantity
address seller
```
## nbItems view ()

## Return Values

```
uint256 _
```
## nbOrders view ()

## Return Values

```
uint256 _
```
## offerItem nonpayable (bytes32,uint256,uint32)

```
Put an item on sale with specified title, price and quantity Emits a
{OnNewItem} event with the itemId of the offered item.
```
## Parameters

```
bytes32 title
uint256 price
uint32 quantity
```
## order nonpayable (uint256[],uint32[])

```
Order a set of items, given a quantity for each of them Emits a {OnNewOrder}
event with the orderId of the created order Requirements: - the caller must
own enough tokens to 'pay' for all items contained in the order - the caller
must have approve the escrow contract for at least enough tokens required to
pay the order - the available quantity of items must be greater or equal to
the ordered quantity
```
## Parameters

```
uint256[] itemIds
uint32[] quantities
```
## owner view ()

```
Returns the address of the current owner.
```
## Return Values

```
address _
```
## renounceOwnership nonpayable ()

```
Leaves the contract without owner. It will not be possible to call
`onlyOwner` functions anymore. Can only be called by the current owner. NOTE:
Renouncing ownership will leave the contract without an owner, thereby
removing any functionality that is only available to the owner.
```
## reset nonpayable ()

```
Reset all internal data, only usefull for demo purpose Requirements: - the
caller is the current contract's owner
```
## transferOwnership nonpayable (address)

```
Transfers ownership of the contract to a new account (`newOwner`). Can only
be called by the current owner.
```
## Parameters

```
address newOwner
```
```
built with hardhat-docgen
```

