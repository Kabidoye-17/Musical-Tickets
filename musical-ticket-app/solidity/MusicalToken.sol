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
    mapping(address => uint256) private ticketsBought; 

    event TicketPurchased(address indexed buyer, uint256 amount);
    event TicketRefunded(address indexed buyer, uint256 amount);
    event TicketReturned(address indexed customer, uint256 amount);
    event FundsWithdrawn(address indexed venue, uint256 amount);
    event FundsDeposited(address indexed from, uint256 amount);
    event TicketPriceUpdated(uint256 oldPrice, uint256 newPrice);

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
        _totalSupply = initialSupply * 10 ** uint256(decimals);
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
        require(sender != address(0), "ERC20: transfer from zero address");
        require(recipient != address(0), "ERC20: transfer to zero address");
        require(_balances[sender] >= amount, "ERC20: transfer amount exceeds balance");

        unchecked {
            _balances[sender] -= amount;
        }
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from zero address");
        require(spender != address(0), "ERC20: approve to zero address");

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
        ticketsBought[msg.sender] += numTickets; 
        emit TicketPurchased(msg.sender, scaledTicketQuantity);
    }

    function getRefund(uint256 numTickets) external noReentrancy {
        uint256 scaledTicketQuantity = numTickets * (10 ** decimals);
        require(_balances[msg.sender] >= scaledTicketQuantity, "Not enough tokens to refund");
        require(address(this).balance >= numTickets * ticketPrice, "Not enough ETH for refund");
        require(ticketsBought[msg.sender] >= numTickets, "You didn't buy that many tickets");

        _transfer(msg.sender, venue, scaledTicketQuantity);
        ticketsBought[msg.sender] -= numTickets; 
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

    function withdrawFunds(uint256 amount) external {
        require(msg.sender == venue, "Only venue can withdraw funds");
        require(address(this).balance >= amount, "Not enough ETH in contract");

        payable(venue).transfer(amount);
        emit FundsWithdrawn(venue, amount);
    }

    function depositFunds() external payable {
        require(msg.sender == venue, "Only venue can deposit funds");
        emit FundsDeposited(msg.sender, msg.value);
    }

    function updateTicketPrice(uint256 newPrice) external {
        require(msg.sender == venue, "Only venue can update the ticket price");
        require(newPrice > 0, "Ticket price must be greater than zero");

        uint256 oldPrice = ticketPrice;
        ticketPrice = newPrice;

        emit TicketPriceUpdated(oldPrice, newPrice);
    }

    // Reentrancy protection
    modifier noReentrancy() {
        require(!locked, "No reentrancy allowed");
        locked = true;
        _;
        locked = false;
    }
}
