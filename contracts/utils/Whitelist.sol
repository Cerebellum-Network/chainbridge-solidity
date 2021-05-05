// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./AccessControl.sol";

contract Whitelist is AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    event WhitelistEnabled(address sender);
    event WhitelistDisabled(address sender);
    event WhitelistAccountAdded(address account);
    event WhitelistAccountRemoved(address account);

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

    function addToWhitelist(address account) external onlyWhitelistOrAdmin {
        require(!isOnWhitelist(account), "Account is already on the whitelist");
        _whitelist.add(account);
        emit WhitelistAccountAdded(account);
    }

    function removeFromWhitelist(address account) external onlyWhitelistOrAdmin {
        require(isOnWhitelist(account), "Account is not on the whitelist");
        _whitelist.remove(account);
        emit WhitelistAccountRemoved(account);
    }

    function isWhitelistEnabled() public view returns (bool) {
        return _isWhitelistEnabled;
    }

    function isOnWhitelist(address account) public view returns (bool) {
        return _whitelist.contains(account);
    }

    function _onlyWhitelistOrAdmin() private view {
        require(hasRole(WHITELISTER_ROLE, msg.sender)
            || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Sender doesn't have Whitelist or Admin role");
    }

    function _usingWhitelist() private view {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender) && isWhitelistEnabled() && !isOnWhitelist(msg.sender))
            revert("Sender is not on the whitelist");
    }
}
