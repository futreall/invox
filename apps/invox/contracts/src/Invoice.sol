// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract Invoice {
    address public immutable owner;

    event PaymentReceived(
        address indexed sender,
        address indexed token,
        uint256 amount,
        string invoiceId
    );

    constructor(address _owner) {
        owner = _owner;
    }

    function pay(address token, uint256 amount, string calldata invoiceId) external {
        require(token != address(0) && amount > 0, "invalid");
        require(IERC20(token).transferFrom(msg.sender, owner, amount), "transfer failed");
        emit PaymentReceived(msg.sender, token, amount, invoiceId);
    }
}
