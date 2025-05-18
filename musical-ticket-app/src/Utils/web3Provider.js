import Web3 from 'web3';
import { sepoliaRPC } from './common';

// Singleton pattern implementation for Web3
class Web3Provider {
  constructor() {
    this.web3Instance = null;
  }

  // Get the Web3 instance (creates one if it doesn't exist)
  getWeb3() {
    if (!this.web3Instance) {
      // Always use sepoliaRPC
      console.log('Using RPC endpoint for web3 provider');
      this.web3Instance = new Web3(sepoliaRPC);
    }
    return this.web3Instance;
  }
  
  // Create contract instance helper method
  getContract(abi, contractAddress) {
    const web3 = this.getWeb3();
    return new web3.eth.Contract(abi, contractAddress);
  }
  
  // Helper method for converting wei to ether
  fromWei(wei) {
    const web3 = this.getWeb3();
    return web3.utils.fromWei(wei, 'ether');
  }
  
  // Helper method for converting ether to wei
  toWei(ether) {
    const web3 = this.getWeb3();
    return web3.utils.toWei(ether.toString(), 'ether');
  }
  
  // Helper method to validate addresses
  isValidAddress(address) {
    const web3 = this.getWeb3();
    return web3.utils.isAddress(address);
  }
  
  // Helper method to get ETH balance
  async getBalance(address) {
    const web3 = this.getWeb3();
    const balanceWei = await web3.eth.getBalance(address);
    return this.fromWei(balanceWei);
  }
  
  // Helper method to check network connection
  async isConnected() {
    const web3 = this.getWeb3();
    return await web3.eth.net.isListening();
  }
  
  // Helper method to create an account from private key
  createAccount(privateKey) {
    const web3 = this.getWeb3();
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    return account;
  }
  
  // Helper method to create a new wallet
  createWallet() {
    const web3 = this.getWeb3();
    return web3.eth.accounts.create();
  }
  
  // Helper method to encrypt a wallet with password
  async encryptWallet(privateKey, password) {
    const web3 = this.getWeb3();
    return await web3.eth.accounts.encrypt(privateKey, password);
  }
}

// Create a singleton instance
const web3Provider = new Web3Provider();

// Export the singleton instance
export default web3Provider;
