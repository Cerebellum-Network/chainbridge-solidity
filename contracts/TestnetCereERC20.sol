// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.6.0 <0.8.0;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestnetCereERC20 is ERC20 {

    function decimals() public view virtual override returns (uint8) {
        return 10;
    }

    constructor(uint256 initialSupply) ERC20("Testnet CERE", "TSTCERE") {
        _mint(msg.sender, initialSupply);
    }
}
