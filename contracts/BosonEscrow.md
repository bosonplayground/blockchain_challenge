## contracts/BosonEscrow.sol

# BosonEscrow

BosonEscrow Escrow implementation.

## constructor nonpayable (address)

## Parameters

```
address _tokenAddress
```
## Events

## OwnershipTransferred (address,address)

## Parameters

```
address previousOwner
address newOwner
```
## Methods

## balanceOf view (address)

```
gets the amount of locked token in escrow for a given account
```
## Parameters

```
address account
```
## Return Values

```
uint256 _
```
## owner view ()

```
Returns the address of the current owner.
```
## Return Values

```
address _
```
## pay nonpayable (address,address,uint256)

```
Perform a payment to the seller of the specified amount, from the locked
balance of the specified buyer
```
## Parameters

```
address buyer
address seller
uint256 amount
```
## placePayment nonpayable (address,uint256)

```
Lock the given amount of token in escrow for the specified buyer
```
## Parameters

```
address buyer
uint256 amount
```
## refund nonpayable (address,uint256)

```
Refund the payment of the specified amount, from the locked balance back to
the specified buyer's account
```
## Parameters

```
address buyer
uint256 amount
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
Reset all internal data, only usefull for demo purpose
```
## tokenAddress view ()

## Return Values

```
address _
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

