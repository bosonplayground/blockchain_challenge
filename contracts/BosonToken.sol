//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev BosonToken Token implementation.
 */
contract BosonToken is Ownable, ERC20 {
    /**
     * @dev The price of a token in wei (1 ETH = 10^18 wei)
     */
    uint256 public tokenPrice; // the price of a token in wei (1 ETH = 10^18 wei)

    /**
     * @dev Create the contract with the given parameters
     */
    constructor(uint256 tokenPrice_) Ownable() ERC20("Boson Token", "BTK") {
        tokenPrice = tokenPrice_;
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
        require(
            address(this).balance > requestedPrice,
            "BosonToken: Contract balance too low"
        );
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(requestedPrice);
    }

    /**
     * @dev Compute the price of a given amount of tokens
     *
     * Arguments:
     * - amount: the amount of token to be quoted in base units (times the token decimals)
     *
     */
    function computePrice(
        uint256 amount
    ) public view returns (uint256 requestedPrice) {
        requestedPrice = (amount * tokenPrice) / (10 ** decimals());
    }

    function withdraw() external onlyOwner {
        require(address(this).balance > 0, "BosonToken: No Fund to withdraw");
        payable(msg.sender).transfer(address(this).balance);
    }
}
