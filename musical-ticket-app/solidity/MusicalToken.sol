// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    event TicketPurchased(address indexed buyer, uint256 amount);
    event TicketRefunded(address indexed buyer, uint256 amount);
    event TicketReturned(address indexed customer, uint256 amount);
    event FundsWithdrawn(address indexed venue, uint256 amount);
    event CustomerVerified(address indexed customer, address indexed doorman, bool hasTicket);
}

contract MusicalToken is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 private _totalSupply;
    uint256 public ticketPrice = 0.01 ether;

    address public venue;
    address public doorman;

    bool private locked = false;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 initialSupply,
        address _venue,
        address _doorman
    ) {
        require(_venue != address(0), "Venue address cannot be zero address");
        require(_doorman != address(0), "Doorman address cannot be zero address");
        require(_venue != _doorman, "Venue and doorman cannot be the same address");

        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        _totalSupply = initialSupply * 10**uint256(decimals);
        venue = _venue;
        doorman = _doorman;

        _balances[venue] = _totalSupply;
        emit Transfer(address(0), venue, _totalSupply);
    }

    // ERC20 Standard Functions
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        _transfer(sender, recipient, amount);
        unchecked {
            _approve(sender, msg.sender, _allowances[sender][msg.sender] - amount);
        }
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(_balances[sender] >= amount, "ERC20: transfer amount exceeds balance");

        unchecked {
            _balances[sender] -= amount;
        }
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    // Custom Functions
    function getTotalTokensSold() external view returns (uint256) {
        return _totalSupply - _balances[venue];
    }

    function getTicketPrice() external view returns (uint256) {
        return ticketPrice;
    }

    function buyTicket(uint256 numTickets) external payable {
        require(msg.sender != venue && msg.sender != doorman, "Venue or Doorman cannot buy tickets");
        require(msg.value == ticketPrice * numTickets, "Incorrect ETH sent");
        
        uint256 scaledTicketQuantity = numTickets * (10 ** decimals);
        require(_balances[venue] >= scaledTicketQuantity, "Not enough tickets left");

        _transfer(venue, msg.sender, scaledTicketQuantity);
        emit TicketPurchased(msg.sender, scaledTicketQuantity);
    }


    function getRefund(uint256 numTickets) external noReentrancy {
        uint256 scaledTicketQuantity = numTickets * (10 ** decimals);
        require(_balances[msg.sender] >= scaledTicketQuantity, "Not enough tokens to get a refund");
        require(address(this).balance >= numTickets * ticketPrice, "Not enough balance to give a refund");

        _transfer(msg.sender, venue, scaledTicketQuantity);
        payable(msg.sender).transfer(numTickets * ticketPrice);
        emit TicketRefunded(msg.sender, scaledTicketQuantity);
    }
    
    function returnTicket(uint256 numTickets) external {
        require(msg.sender != venue && msg.sender != doorman, "Venue or Doorman cannot return tickets");
        
        uint256 scaledTicketQuantity = numTickets * (10 ** decimals);
        require(_balances[msg.sender] >= scaledTicketQuantity, "Not enough tickets to return");

        _transfer(msg.sender, venue, scaledTicketQuantity);
        emit TicketReturned(msg.sender, scaledTicketQuantity);
    }

    modifier noReentrancy() {
        require(!locked, "No reentrancy allowed");
        locked = true;
        _;
        locked = false;
    }
}
