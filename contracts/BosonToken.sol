//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @dev BosonToken Token implementation.
 */
contract BosonToken is Ownable, ERC20 {
    using SafeMath for uint256;
  
    /**
     * @dev The price of a token in wei (1 ETH = 10^18 wei)
     */
    uint256 public tokenPrice; // the price of a token in wei (1 ETH = 10^18 wei)

    /**
        * @dev Create the contract with the given parameters
        */
    constructor(uint256 tokenPrice_) 
    Ownable() ERC20("Boson Token", "BTK")
    {
        tokenPrice = tokenPrice_;
        _setupDecimals(18);
    }

    /** 
    * @dev Credit the calling account with the given amount of tokens
    * if the caller is paying enough to cover the price of the requested amount of tokens
    *
    */
    function credit(uint256 amount) external payable {
        _mint(msg.sender, amount);
    }

    /** 
    * @dev Resell the given amount of token
     *
     */
    function sell(uint256 amount) external {
        uint256 requestedPrice = computePrice(amount);
        require(address(this).balance > requestedPrice, "BosonToken: Contract balance too low");
        _burn(msg.sender, amount);
        msg.sender.transfer(requestedPrice);
    }

    /** 
    * @dev Compute the price of a given amount of tokens
     *
     * Arguments:
     * - amount: the amount of token to be quoted in base units (times the token decimals)
     *
     */
    function computePrice(uint256 amount) public view returns (uint256 requestedPrice) {
        requestedPrice = amount.mul(tokenPrice).div(10**decimals());
    }

    function withdraw() external onlyOwner {
        require(address(this).balance > 0, "BosonToken: No Fund to withdraw");
        msg.sender.transfer(address(this).balance);
    }

}
