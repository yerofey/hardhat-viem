// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken is ERC20, Ownable {
    uint256 private _maxSupply;
    mapping(address => bool) private _blacklisted;

    error BlacklistedAddress(address account);
    error InsufficientBalance(address account, uint256 balance, uint256 amount);

    event TokensBurned(address indexed burner, uint256 amount);
    event AddressBlacklisted(address indexed account);
    event AddressUnblacklisted(address indexed account);

    constructor() ERC20("TestToken", "TEST") Ownable(msg.sender) {
        _maxSupply = 1000000 * 10 ** decimals();
        _mint(msg.sender, _maxSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= _maxSupply, "Exceeds max supply");
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        if (_blacklisted[msg.sender]) revert BlacklistedAddress(msg.sender);
        uint256 balance = balanceOf(msg.sender);
        if (balance < amount) revert InsufficientBalance(msg.sender, balance, amount);
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    function blacklist(address account) public onlyOwner {
        _blacklisted[account] = true;
        emit AddressBlacklisted(account);
    }

    function unblacklist(address account) public onlyOwner {
        _blacklisted[account] = false;
        emit AddressUnblacklisted(account);
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklisted[account];
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (_blacklisted[msg.sender]) revert BlacklistedAddress(msg.sender);
        if (_blacklisted[to]) revert BlacklistedAddress(to);
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (_blacklisted[from]) revert BlacklistedAddress(from);
        if (_blacklisted[to]) revert BlacklistedAddress(to);
        return super.transferFrom(from, to, amount);
    }

    function _beforeTokenTransfer(
        address,
        address,
        uint256 amount
    ) internal virtual {
        if (amount == 0) revert("Amount must be greater than 0");
    }
}
