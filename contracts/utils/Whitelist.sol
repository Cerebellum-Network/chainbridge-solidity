// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./AccessControl.sol";

contract Whitelist is AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    event WhitelistEnabled(address senderAddress);
    event WhitelistDisabled(address senderAddress);
    event WhitelistAddressAdded(address addedAddress);
    event WhitelistAddressRemoved(address removedAddress);

    bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

    bool private _isWhitelistEnabled;
    EnumerableSet.AddressSet private _whitelist;

    modifier onlyWhitelistOrAdmin() {
        _onlyWhitelistOrAdmin();
        _;
    }

    modifier usingWhitelist() {
        _usingWhitelist();
        _;
    }

    function enableWhitelist() external onlyWhitelistOrAdmin {
        require(!isWhitelistEnabled(), "Whitelist is already enabled");
        _isWhitelistEnabled = true;
        emit WhitelistEnabled(msg.sender);
    }

    function disableWhitelist() external onlyWhitelistOrAdmin {
        require(isWhitelistEnabled(), "Whitelist is already disabled");
        _isWhitelistEnabled = false;
        emit WhitelistDisabled(msg.sender);
    }

    function isWhitelistEnabled() public view returns (bool) {
        return _isWhitelistEnabled;
    }

    function addToWhitelist(address addressToAdd) public onlyWhitelistOrAdmin {
        require(!isWhitelisted(addressToAdd), "Address to add is already whitelisted");
        _whitelist.add(addressToAdd);
        emit WhitelistAddressAdded(addressToAdd);
    }

    function removeFromWhitelist(address addressToRemove) public onlyWhitelistOrAdmin {
        require(isWhitelisted(addressToRemove), "Address to remove is not whitelisted");
        _whitelist.remove(addressToRemove);
        emit WhitelistAddressRemoved(addressToRemove);
    }

    function isWhitelisted(address addressToCheck) public view returns (bool) {
        return _whitelist.contains(addressToCheck);
    }

    function _onlyWhitelistOrAdmin() private view {
        require(hasRole(WHITELISTER_ROLE, msg.sender)
            || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Sender doesn't have Whitelister or Admin role");
    }

    function _usingWhitelist() private view {
        if (isWhitelistEnabled() && !isWhitelisted(msg.sender))
            revert("Sender address is not whitelisted");
    }
}
