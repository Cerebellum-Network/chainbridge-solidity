pragma solidity >=0.6.0 <0.8.0;

import "./utils/Whitelist.sol";

contract NoArgument {
    event NoArgumentCalled();

    function noArgument() external {
        emit NoArgumentCalled();
    }
}

contract OneArgument {
    event OneArgumentCalled(uint256 indexed argumentOne);

    function oneArgument(uint256 argumentOne) external {
        emit OneArgumentCalled(argumentOne);
    }
}

contract TwoArguments {
    event TwoArgumentsCalled(address[] argumentOne, bytes4 argumentTwo);

    function twoArguments(address[] calldata argumentOne, bytes4 argumentTwo) external {
        emit TwoArgumentsCalled(argumentOne, argumentTwo);
    }
}

contract ThreeArguments {
    event ThreeArgumentsCalled(string argumentOne, int8 argumentTwo, bool argumentThree);

    function threeArguments(string calldata argumentOne, int8 argumentTwo, bool argumentThree) external {
        emit ThreeArgumentsCalled(argumentOne, argumentTwo, argumentThree);
    }
}

contract TestWhitelist is Whitelist {
    event TestCalled();

    constructor () public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function testWhitelist() external onlyWhitelisted {
        emit TestCalled();
    }
}
