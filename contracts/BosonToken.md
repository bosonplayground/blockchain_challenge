## contracts/BosonToken.sol

# BosonToken

BosonToken Token implementation.

## constructor nonpayable (uint256)

## Parameters

```
uint256 tokenPrice_
```
## Events

## Approval (address,address,uint256)

## Parameters

```
address owner
address spender
uint256 value
```
## OwnershipTransferred (address,address)

## Parameters

```
address previousOwner
address newOwner
```
## Transfer (address,address,uint256)

## Parameters

```
address from
address to
uint256 value
```
## State Variables

## tokenPrice view ()

```
The price of a token in wei (1 ETH = 10^18 wei)
```
## Return Values

```
uint256 _
```
## Methods

## allowance view (address,address)

```
See {IERC20-allowance}.
```
## Parameters

```
address owner
address spender
```
## Return Values

```
uint256 _
```
## approve nonpayable (address,uint256)

```
See {IERC20-approve}. Requirements: - `spender` cannot be the zero address.
```
## Parameters

```
address spender
uint256 amount
```
## Return Values

```
bool _
```
## balanceOf view (address)

```
See {IERC20-balanceOf}.
```
## Parameters

```
address account
```
## Return Values

```
uint256 _
```
## computePrice view (uint256)

```
Compute the price of a given amount of tokens Arguments: - amount: the amount
of token to be quoted in base units (times the token decimals)
```
## Parameters

```
uint256 amount
```
## Return Values

```
uint256 requestedPrice
```
## credit payable (uint256)

```
Credit the call account with the given amount of tokens, assuming that the
caller is paying the price requested for this amount
```
## Parameters

```
uint256 amount
```
## decimals view ()

```
Returns the number of decimals used to get its user representation. For
example, if `decimals` equals `2`, a balance of `505` tokens should be
displayed to a user as `5,05` (`505 / 10 ** 2`). Tokens usually opt for a
value of 18, imitating the relationship between Ether and Wei. This is the
value {ERC20} uses, unless {_setupDecimals} is called. NOTE: This information
is only used for _display_ purposes: it in no way affects any of the
arithmetic of the contract, including {IERC20-balanceOf} and {IERC20-
transfer}.
```
## Return Values

```
uint8 _
```
## decreaseAllowance nonpayable (address,uint256)

```
Atomically decreases the allowance granted to `spender` by the caller. This
is an alternative to {approve} that can be used as a mitigation for problems
described in {IERC20-approve}. Emits an {Approval} event indicating the
updated allowance. Requirements: - `spender` cannot be the zero address. -
`spender` must have allowance for the caller of at least `subtractedValue`.
```
## Parameters

```
address spender
uint256 subtractedValue
```
## Return Values

```
bool _
```
## increaseAllowance nonpayable (address,uint256)

```
Atomically increases the allowance granted to `spender` by the caller. This
is an alternative to {approve} that can be used as a mitigation for problems
described in {IERC20-approve}. Emits an {Approval} event indicating the
updated allowance. Requirements: - `spender` cannot be the zero address.
```
## Parameters

```
address spender
uint256 addedValue
```
## Return Values

```
bool _
```
## name view ()

```
Returns the name of the token.
```
## Return Values

```
string _
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
## sell nonpayable (uint256)

```
Resell the given amount of token
```
## Parameters

```
uint256 amount
```
## symbol view ()

```
Returns the symbol of the token, usually a shorter version of the name.
```
## Return Values

```
string _
```
## totalSupply view ()

```
See {IERC20-totalSupply}.
```
## Return Values

```
uint256 _
```
## transfer nonpayable (address,uint256)

```
See {IERC20-transfer}. Requirements: - `recipient` cannot be the zero
address. - the caller must have a balance of at least `amount`.
```
## Parameters

```
address recipient
uint256 amount
```
## Return Values

```
bool _
```
## transferFrom nonpayable (address,address,uint256)

```
See {IERC20-transferFrom}. Emits an {Approval} event indicating the updated
allowance. This is not required by the EIP. See the note at the beginning of
{ERC20}. Requirements: - `sender` and `recipient` cannot be the zero address.
```
- `sender` must have a balance of at least `amount`. - the caller must have
allowance for ``sender``'s tokens of at least `amount`.

## Parameters

```
address sender
address recipient
uint256 amount
```
## Return Values

```
bool _
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
## withdraw nonpayable ()

```
built with hardhat-docgen
```

