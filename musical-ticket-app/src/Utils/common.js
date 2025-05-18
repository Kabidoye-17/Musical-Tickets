import web3Provider from './web3Provider';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

// Existing exports (keep these)
export const contractAddress = '0x799403a225641318304200a51fd7a62991dc8e80'; // Your contract address here
export const sepoliaRPC = 'https://sepolia.infura.io/v3/6f6f1ab124ff4449869f5df930ae6fd4';
export const decimal = 18;
export const ABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_symbol",
				"type": "string"
			},
			{
				"internalType": "uint8",
				"name": "_decimals",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "initialSupply",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_venue",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_doorman",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "numTickets",
				"type": "uint256"
			}
		],
		"name": "buyTicket",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "venue",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsWithdrawn",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "numTickets",
				"type": "uint256"
			}
		],
		"name": "getRefund",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "numTickets",
				"type": "uint256"
			}
		],
		"name": "returnTicket",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "TicketPurchased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "TicketRefunded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "customer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "TicketReturned",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "doorman",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTicketPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTotalTokensSold",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "ticketPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "venue",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Contract helper functions
const getContract = () => {
  return web3Provider.getContract(ABI, contractAddress);
};

// Ethers.js helpers
export const getEthersContract = (signer) => {
  return new ethers.Contract(contractAddress, ABI, signer);
};

// Read functions
export const getBalanceOf = async (address) => {
  const contract = getContract();
  const balance = await contract.methods.balanceOf(address).call();
  return web3Provider.fromWei(balance);
};

export const getTicketPrice = async () => {
  const contract = getContract();
  const price = await contract.methods.getTicketPrice().call();
  return web3Provider.fromWei(price);
};

export const getTotalTokensSold = async () => {
  const contract = getContract();
  const sold = await contract.methods.getTotalTokensSold().call();
  return web3Provider.fromWei(sold);
};

export const getTotalSupply = async () => {
  const contract = getContract();
  const supply = await contract.methods.totalSupply().call();
  return web3Provider.fromWei(supply);
};

export const getVenueAddress = async () => {
  const contract = getContract();
  return await contract.methods.venue().call();
};

export const getDoormanAddress = async () => {
  const contract = getContract();
  return await contract.methods.doorman().call();
};

export const getAllowance = async (owner, spender) => {
  const contract = getContract();
  const allowance = await contract.methods.allowance(owner, spender).call();
  return web3Provider.fromWei(allowance);
};

export const getDecimals = async () => {
  const contract = getContract();
  return await contract.methods.decimals().call();
};

export const getName = async () => {
  const contract = getContract();
  return await contract.methods.name().call();
};

export const getSymbol = async () => {
  const contract = getContract();
  return await contract.methods.symbol().call();
};

// Write functions (with transaction parameters)
export const buyTicket = async (numTickets, account, value) => {
  const contract = getContract();
  const data = contract.methods.buyTicket(numTickets).encodeABI();
  
  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 200000,
    value: value,
    data: data
  };
  
  const web3 = web3Provider.getWeb3();
  return await web3.eth.sendTransaction(tx);
};

export const getRefund = async (numTickets, account) => {
  const contract = getContract();
  const data = contract.methods.getRefund(numTickets).encodeABI();
  
  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 200000,
    data: data
  };
  
  const web3 = web3Provider.getWeb3();
  return await web3.eth.sendTransaction(tx);
};

export const returnTicket = async (numTickets, account) => {
  const contract = getContract();
  const data = contract.methods.returnTicket(numTickets).encodeABI();
  
  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 200000,
    data: data
  };
  
  const web3 = web3Provider.getWeb3();
  return await web3.eth.sendTransaction(tx);
};

export const transfer = async (recipient, amount, account) => {
  const contract = getContract();
  const data = contract.methods.transfer(recipient, amount).encodeABI();
  
  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 200000,
    data: data
  };
  
  const web3 = web3Provider.getWeb3();
  return await web3.eth.sendTransaction(tx);
};

export const approve = async (spender, amount, account) => {
  const contract = getContract();
  const data = contract.methods.approve(spender, amount).encodeABI();
  
  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 200000,
    data: data
  };
  
  const web3 = web3Provider.getWeb3();
  return await web3.eth.sendTransaction(tx);
};

export const transferFrom = async (sender, recipient, amount, account) => {
  const contract = getContract();
  const data = contract.methods.transferFrom(sender, recipient, amount).encodeABI();
  
  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 200000,
    data: data
  };
  
  const web3 = web3Provider.getWeb3();
  return await web3.eth.sendTransaction(tx);
};

// Ethers.js versions of the write functions
export const returnTicketEthers = async (numTickets, signer) => {
  const contract = getEthersContract(signer);
  const tx = await contract.returnTicket(numTickets);
  return await tx.wait();
};

export const buyTicketEthers = async (numTickets, signer, valueInEther) => {
  const contract = getEthersContract(signer);
  const valueInWei = ethers.parseEther(valueInEther.toString());
  const tx = await contract.buyTicket(numTickets, { value: valueInWei });
  return await tx.wait();
};

export const getRefundEthers = async (numTickets, signer) => {
  const contract = getEthersContract(signer);
  const tx = await contract.getRefund(numTickets);
  return await tx.wait();
};

export const transferEthers = async (recipient, amount, signer) => {
  const contract = getEthersContract(signer);
  const tx = await contract.transfer(recipient, amount);
  return await tx.wait();
};

export const approveEthers = async (spender, amount, signer) => {
  const contract = getEthersContract(signer);
  const tx = await contract.approve(spender, amount);
  return await tx.wait();
};

export const transferFromEthers = async (sender, recipient, amount, signer) => {
  const contract = getEthersContract(signer);
  const tx = await contract.transferFrom(sender, recipient, amount);
  return await tx.wait();
};

// Helper for getting past events
export const getPastTransferEvents = async () => {
  const contract = getContract();
  return await contract.getPastEvents('Transfer', {
    fromBlock: 0,
    toBlock: 'latest'
  });
};

// Helper for getting ticket purchase events
export const getPastTicketPurchasedEvents = async () => {
  const contract = getContract();
  return await contract.getPastEvents('TicketPurchased', {
    fromBlock: 0,
    toBlock: 'latest'
  });
};

// Helper for getting ticket refund events
export const getPastTicketRefundedEvents = async () => {
  const contract = getContract();
  return await contract.getPastEvents('TicketRefunded', {
    fromBlock: 0,
    toBlock: 'latest'
  });
};

// Wallet role verification utilities
export const WALLET_ROLES = {
  VENUE: 'venue',
  DOORMAN: 'doorman',
  CUSTOMER: 'customer', // Default role for non-special wallets
};

export const AUTHORIZED_HASHES = {
  [process.env.REACT_APP_VENUE_HASH]: WALLET_ROLES.VENUE,
  [process.env.REACT_APP_DOORMAN_HASH]: WALLET_ROLES.DOORMAN,
};

/**
 * Hashes a wallet address using SHA-256
 * @param {string} address - The wallet address to hash
 * @returns {string} The SHA-256 hash of the address
 */
export const hashWalletAddress = (address) => {
  if (!address) return '';
  return CryptoJS.SHA256(address.trim().toLowerCase()).toString();
};

/**
 * Gets the role of a wallet address
 * @param {string} address - The wallet address to check
 * @returns {string|null} The role of the wallet or null if it's not a special wallet
 */
export const getWalletRole = (address) => {
  if (!address) return null;
  const hashedAddress = hashWalletAddress(address);
  return AUTHORIZED_HASHES[hashedAddress] || WALLET_ROLES.CUSTOMER;
};

/**
 * Checks if a wallet address is one of the specified roles
 * @param {string} address - The wallet address to check
 * @param {string|string[]} roles - A single role or array of roles to check against
 * @returns {boolean} True if the wallet is one of the specified roles
 */
export const isWalletRole = (address, roles) => {
  const walletRole = getWalletRole(address);
  
  // If roles is a string, convert it to an array for consistent processing
  const rolesToCheck = typeof roles === 'string' ? [roles] : roles;
  
  return rolesToCheck.includes(walletRole);
};

/**
 * Checks if a wallet address is a special wallet (venue or doorman)
 * @param {string} address - The wallet address to check
 * @returns {boolean} True if the wallet is a special wallet
 */
export const isSpecialWallet = (address) => {
  return isWalletRole(address, [WALLET_ROLES.VENUE, WALLET_ROLES.DOORMAN]);
};