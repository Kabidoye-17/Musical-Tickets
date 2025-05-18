import { ethers, BrowserProvider } from 'ethers';
import { contractAddress, ABI } from './common';

// Singleton pattern implementation for Ethers.js
class EthersProvider {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  // Get the BrowserProvider instance (creates one if it doesn't exist)
  async getProvider() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    if (!this.provider) {
      this.provider = new BrowserProvider(window.ethereum);
    }
    return this.provider;
  }

  // Get a signer instance
  async getSigner() {
    const provider = await this.getProvider();
    if (!this.signer) {
      this.signer = await provider.getSigner();
    }
    return this.signer;
  }

  // Get a contract instance with signer
  async getContract() {
    const signer = await this.getSigner();
    return new ethers.Contract(contractAddress, ABI, signer);
  }
  
  // Reset signer (useful when accounts change)
  resetSigner() {
    this.signer = null;
  }
  
  // Helper method to convert ether to wei
  parseEther(amount) {
    return ethers.parseEther(amount.toString());
  }
  
  // Helper method to convert wei to ether
  formatEther(amount) {
    return ethers.formatEther(amount);
  }
}

// Create a singleton instance
const ethersProvider = new EthersProvider();

// Export the singleton instance
export default ethersProvider;
