//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "./BosonToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

/**
 * @dev BosonEscrow Escrow implementation.
 */
contract BosonEscrow is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMath for uint256;

    address public tokenAddress;
    mapping(address => uint256) private escrowBalances;
    EnumerableSet.AddressSet private accountsSet; // for reset(), usefull only for demo
    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress;
    }

    /** 
    * @dev gets the amount of locked token in escrow for a given account
     *
     */
    function balanceOf(address account) public view returns (uint256) {
        require((msg.sender == owner()) || (msg.sender == account), "BosonEscrow: NOT AUTHORIZED");
        return escrowBalances[account];
    }

    /** 
    * @dev Lock the given amount of token in escrow for the specified buyer
     *
     */
    function placePayment(address buyer, uint256 amount) external onlyOwner {
        require(IERC20(tokenAddress).transferFrom(buyer, address(this), amount), "BosonEscrow: token transfer failed");
        accountsSet.add(buyer);
        escrowBalances[buyer] = escrowBalances[buyer].add(amount);
    }

    /** 
    * @dev Refund the payment of the specified amount, from the locked balance back to the specified buyer's account
     *
     */
    function refund(address buyer, uint256 amount) external onlyOwner {
        require(escrowBalances[buyer] >= amount, "BosonEscrow: escrow balance too low");
        require(IERC20(tokenAddress).transfer(buyer, amount), "BosonEscrow: token transfer failed");
        escrowBalances[buyer] = escrowBalances[buyer].sub(amount);
    }

    /** 
    * @dev Perform a payment to the seller of the specified amount, from the locked balance of the specified buyer
     *
     */
    function pay(address buyer, address seller, uint256 amount) external onlyOwner {
        require(escrowBalances[buyer] >= amount, "BosonEscrow: escrow balance too low");
        require(IERC20(tokenAddress).transfer(seller, amount), "BosonEscrow: token transfer failed");
        escrowBalances[buyer] = escrowBalances[buyer].sub(amount);
    }

    /** 
    * @dev Reset all internal data, only usefull for demo purpose
     *
     */
    function reset() public onlyOwner {
        while (accountsSet.length() > 0) {
            address account = accountsSet.at(0);
            accountsSet.remove((account));
            delete escrowBalances[account];
        }
        require(accountsSet.length() == 0);
    }





}