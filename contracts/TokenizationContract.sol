// SPDX-License-Identifier: MIT
// Solves Issue #20 (0.12 XMR Bounty)
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RealEstateTokenization is ERC20, Ownable, ReentrancyGuard {
    string public propertyAddress;
    uint256 public totalPropertyValuationUSD;

    event PropertyTokenized(string addressDetails, uint256 valuationUSD, uint256 totalSupply);

    constructor(
        string memory name,
        string memory symbol,
        string memory _propertyAddress,
        uint256 _valuationUSD,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        propertyAddress = _propertyAddress;
        totalPropertyValuationUSD = _valuationUSD;
        _mint(msg.sender, initialSupply * 10 ** decimals());
        emit PropertyTokenized(_propertyAddress, _valuationUSD, initialSupply);
    }

    function mintPropertyTokens(address to, uint256 amount) external onlyOwner nonReentrant {
        _mint(to, amount);
    }
}
