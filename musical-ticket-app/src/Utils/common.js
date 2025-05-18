import web3Provider from './web3Provider';
import { ethers } from 'ethers';


export const contractAddress = '0x5f4e27f469fff808280bf1c70de30b1e06812c03'; 
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
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsDeposited",
		"type": "event"
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
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "oldPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newPrice",
				"type": "uint256"
			}
		],
		"name": "TicketPriceUpdated",
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
		"name": "depositFunds",
		"outputs": [],
		"stateMutability": "payable",
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
				"internalType": "uint256",
				"name": "newPrice",
				"type": "uint256"
			}
		],
		"name": "updateTicketPrice",
		"outputs": [],
		"stateMutability": "nonpayable",
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
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdrawFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

// Contract helper 
const getContract = () => {
  return web3Provider.getContract(ABI, contractAddress);
};

// Ethers.js helper
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
}


// Web3.js implementation - For use with Keystore wallet
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


// Ethers.js implementation - For use with MetaMask
export const buyTicketEthers = async (numTickets, signer, valueInEther) => {
  const contract = getEthersContract(signer);
  const valueInWei = ethers.parseEther(valueInEther.toString());
  const tx = await contract.buyTicket(numTickets, { value: valueInWei });
  return await tx.wait();
};


// Web3.js implementation - For use with Keystore wallet
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

// Ethers.js implementation - For use with MetaMask
export const getRefundEthers = async (numTickets, signer) => {
  const contract = getEthersContract(signer);
  const tx = await contract.getRefund(numTickets);
  return await tx.wait();
};

// Web3.js implementation - For use with Keystore wallet
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

// Ethers.js implementation - For use with MetaMask
export const returnTicketEthers = async (numTickets, signer) => {
  const contract = getEthersContract(signer);
  const tx = await contract.returnTicket(numTickets);
  return await tx.wait();
};



// Used to identify addresses with balances for displaying in the UI
export const getPastTransferEvents = async () => {
  const contract = getContract();
  return await contract.getPastEvents('Transfer', {
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


export const getWalletRole = async (address ) => {
  if (!address) return WALLET_ROLES.CUSTOMER;
  
  try {
    const venueAddress = await getVenueAddress();
    if (address.toLowerCase() === venueAddress.toLowerCase()) {
      return WALLET_ROLES.VENUE;
    }
    
    const doormanAddress = await getDoormanAddress();
    if (address.toLowerCase() === doormanAddress.toLowerCase()) {
      return WALLET_ROLES.DOORMAN;
    }
  } catch (error) {
    console.error("Error determining wallet role:", error);
  }
  return WALLET_ROLES.CUSTOMER;
};

export const isWalletRole = async (address , roles ) => {
  const walletRole = await getWalletRole(address);
  
  // If roles is a string, convert it to an array for consistent processing
  const rolesToCheck = typeof roles === 'string' ? [roles] : roles;
  
  return rolesToCheck.includes(walletRole);
};

export const isSpecialWallet = async (address ) => {
  return await isWalletRole(address, [WALLET_ROLES.VENUE, WALLET_ROLES.DOORMAN]);
};

// Web3.js implementation - For use with Keystore wallet
export const updateTicketPrice = async (newPriceEth, account) => {
  const contract = getContract();
  const newPriceWei = web3Provider.toWei(newPriceEth);
  const data = contract.methods.updateTicketPrice(newPriceWei).encodeABI();
  
  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 200000,
    data: data
  };
  
  const web3 = web3Provider.getWeb3();
  return await web3.eth.sendTransaction(tx);
};

// Ethers.js implementation - For use with MetaMask
export const updateTicketPriceEthers = async (newPriceEth, signer) => {
  const contract = getEthersContract(signer);
  const newPriceWei = ethers.parseEther(newPriceEth.toString());
  const tx = await contract.updateTicketPrice(newPriceWei);
  return await tx.wait();
};

// Web3.js implementation - For use with Keystore wallet
export const withdrawFunds = async (amountEth, account) => {
  const contract = getContract();
  const amountWei = web3Provider.toWei(amountEth);
  const data = contract.methods.withdrawFunds(amountWei).encodeABI();
  
  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 200000,
    data: data
  };
  
  const web3 = web3Provider.getWeb3();
  return await web3.eth.sendTransaction(tx);
};

// Ethers.js implementation - For use with MetaMask
export const withdrawFundsEthers = async (amountEth, signer) => {
  const contract = getEthersContract(signer);
  const amountWei = ethers.parseEther(amountEth.toString());
  const tx = await contract.withdrawFunds(amountWei);
  return await tx.wait();
};

// Web3.js implementation - For use with Keystore wallet
export const depositFunds = async (amountEth, account) => {
  const contract = getContract();
  const amountWei = web3Provider.toWei(amountEth);
  const data = contract.methods.depositFunds().encodeABI();
  
  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 200000,
    value: amountWei,
    data: data
  };
  
  const web3 = web3Provider.getWeb3();
  return await web3.eth.sendTransaction(tx);
};

// Ethers.js implementation - For use with MetaMask
export const depositFundsEthers = async (amountEth, signer) => {
  const contract = getEthersContract(signer);
  const amountWei = ethers.parseEther(amountEth.toString());
  const tx = await contract.depositFunds({ value: amountWei });
  return await tx.wait();
};