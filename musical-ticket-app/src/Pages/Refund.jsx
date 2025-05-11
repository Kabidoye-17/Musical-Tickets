import React, { useState, useEffect } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import Web3 from 'web3';
import styled from 'styled-components';
import NotificationModal from '../Components/NotificationModal';
import DetailsBox from '../Components/DetailsBox';
import { PageTitle, SubTitle, PasswordInput, ActionButton } from './CreateWallet';
import { ABI, contractAddress, sepoliaRPC, decimal } from '../common';
import CryptoJS from 'crypto-js';
import { Ticket } from "@phosphor-icons/react";

const FileInput = styled(PasswordInput)`
  padding: 10px;
`;

// Connection method toggle
const ConnectionToggle = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
  width: 100%;
  max-width: 400px;
`;

const ToggleOption = styled.button`
  flex: 1;
  padding: 12px;
  background-color: ${props => props.active ? '#ff9c59' : '#fff'};
  color: ${props => props.active ? '#fff' : '#333'};
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 500;

  &:hover {
    background-color: ${props => props.active ? '#ff7f40' : '#fff8f3'};
  }
`;

const TicketSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
`;

const TicketInfo = styled.div`
  font-size: 1.5rem;
  color: #333;
  margin: 10px 0;
`;

const QuantitySelector = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 15px 0;
`;

const QuantityInput = styled.input`
  width: 80px;
  padding: 10px;
  text-align: center;
  font-size: 1.2rem;
  border: 2px solid #ff9c59;
  border-radius: 5px;
  &:focus {
    outline: none;
    border-color: #ff7f40;
  }
`;

const QuantityButton = styled.button`
  padding: 10px 15px;
  background-color: #ff9c59;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #ff7f40;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const WarningBox = styled.div`
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  font-size: 14px;
`;

// Make sure WarningIcon is defined
const WarningIcon = styled.span`
  font-size: 20px;
  margin-right: 10px;
`;

const RefundButton = styled(ActionButton)`
  background-color: #dc3545;
  
  &:hover {
    background-color: #c82333;
  }
`;

function Refund() {
  const [password, setPassword] = useState('');
  const [keystoreFile, setKeystoreFile] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [notification, setNotification] = useState({ success: false, message: "" });
  const [showNotification, setShowNotification] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [connectionMethod, setConnectionMethod] = useState('keystore');
  const [ticketBalance, setTicketBalance] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(0.01); // Default value, will update from contract
  
  // Special wallet addresses that can't issue refunds
  const authorizedHashes = {
    [process.env.REACT_APP_VENUE_HASH]: "venue",
    [process.env.REACT_APP_DOORMAN_HASH]: "doorman",
  };

  const hashWalletAddress = (address) => {
    return CryptoJS.SHA256(address.trim().toLowerCase()).toString();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setKeystoreFile(e.target.files[0]);
    }
  };

  // Get ticket price from contract when component loads
  useEffect(() => {
    const getTicketPriceFromContract = async () => {
      try {
        const web3 = new Web3(sepoliaRPC);
        const contract = new web3.eth.Contract(ABI, contractAddress);
        const priceWei = await contract.methods.getTicketPrice().call();
        const priceEth = web3.utils.fromWei(priceWei, 'ether');
        setTicketPrice(parseFloat(priceEth));
      } catch (error) {
        console.error("Error fetching ticket price:", error);
      }
    };
    
    getTicketPriceFromContract();
  }, []);

  // MetaMask connection
  const connectMetaMask = async () => {
    setIsLoading(true);
    
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install it to continue.");
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      // Check if the wallet is a special role (venue or doorman)
      const hashedAddress = hashWalletAddress(address);
      const role = authorizedHashes[hashedAddress];
      
      if (role) {
        setNotification({
          success: false,
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} wallets cannot request refunds. This functionality is for customers only.`
        });
        setShowNotification(true);
        setIsLoading(false);
        return;
      }
      
      // Create a BrowserProvider to interact with MetaMask
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Store the wallet info
      setWalletInfo({
        address: address,
        privateKey: null
      });
      
      // Store the signer as our wallet object for later use
      setWallet(signer);
      
      // Get ticket balance
      await getTicketBalance(address);
      
      setNotification({ 
        success: true, 
        message: "Connected to MetaMask successfully!" 
      });
      setShowNotification(true);
    } catch (err) {
      setNotification({ 
        success: false, 
        message: err.message || "Failed to connect to MetaMask" 
      });
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Keystore wallet decryption
  const decryptWallet = async () => {
    if (!keystoreFile) {
      setNotification({ 
        success: false, 
        message: "Please select a keystore file" 
      });
      setShowNotification(true);
      return;
    }

    if (!password) {
      setNotification({ 
        success: false, 
        message: "Please enter your wallet password" 
      });
      setShowNotification(true);
      return;
    }

    setIsLoading(true);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        try {
          const decryptedWallet = await ethers.Wallet.fromEncryptedJson(event.target.result, password);
          
          // Check if the wallet is a special role
          const hashedAddress = hashWalletAddress(decryptedWallet.address);
          const role = authorizedHashes[hashedAddress];
          
          if (role) {
            setNotification({
              success: false,
              message: `${role.charAt(0).toUpperCase() + role.slice(1)} wallets cannot request refunds. This functionality is for customers only.`
            });
            setShowNotification(true);
            setIsLoading(false);
            return;
          }
          
          setWallet(decryptedWallet);
          setWalletInfo({
            address: decryptedWallet.address,
            privateKey: decryptedWallet.privateKey
          });
          
          // Get ticket balance
          await getTicketBalance(decryptedWallet.address);
          
          setNotification({ 
            success: true, 
            message: "Wallet decrypted successfully!" 
          });
          setShowNotification(true);
        } catch (err) {
          setNotification({ 
            success: false, 
            message: "Failed to decrypt wallet. Please check your password and file." 
          });
          setShowNotification(true);
        } finally {
          setIsLoading(false);
        }
      };

      fileReader.onerror = () => {
        setNotification({ 
          success: false, 
          message: "Failed to read the file" 
        });
        setShowNotification(true);
        setIsLoading(false);
      };

      fileReader.readAsText(keystoreFile);
    } catch (err) {
      setNotification({ 
        success: false, 
        message: err.message || "An error occurred" 
      });
      setShowNotification(true);
      setIsLoading(false);
    }
  };

  // Get ticket balance for an address
  const getTicketBalance = async (address) => {
    try {
      const web3 = new Web3(sepoliaRPC);
      const contract = new web3.eth.Contract(ABI, contractAddress);
      const balance = await contract.methods.balanceOf(address).call();
      const formattedBalance = parseFloat(web3.utils.fromWei(balance, 'ether'));
      setTicketBalance(formattedBalance);
      
      // If no tickets, show a notification
      if (formattedBalance === 0) {
        setNotification({
          success: false,
          message: "You don't have any tickets to refund."
        });
        setShowNotification(true);
      }
      
      return formattedBalance;
    } catch (error) {
      console.error("Error fetching ticket balance:", error);
      return 0;
    }
  };

  // Process the refund
  const processRefund = async () => {
    if (!wallet) {
      setNotification({
        success: false,
        message: "Wallet not available. Please connect to your wallet first."
      });
      setShowNotification(true);
      return;
    }

    // Check if user has enough tickets
    if (ticketBalance < ticketQuantity) {
      setNotification({
        success: false,
        message: `You don't have enough tickets. Your balance: ${ticketBalance} tickets.`
      });
      setShowNotification(true);
      return;
    }

    setIsRefunding(true);

    try {
      if (connectionMethod === 'metamask') {
        // Using MetaMask with Ethers v6
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(contractAddress, ABI, signer);
        
        // Call the contract method
        const tx = await contract.getRefund(ticketQuantity);
        const receipt = await tx.wait();
        
        // Update ticket balance after refund
        await getTicketBalance(walletInfo.address);
        
        setNotification({
          success: true,
          message: `Successfully refunded ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.transactionHash ? receipt.transactionHash : "Check your wallet for the transaction."}`
        });
      } else {
        // Using keystore wallet
        const web3 = new Web3(sepoliaRPC);
        const contract = new web3.eth.Contract(ABI, contractAddress);
        
        // Create a web3 account using the private key
        const account = web3.eth.accounts.privateKeyToAccount(wallet.privateKey);
        web3.eth.accounts.wallet.add(account);
        
        const tx = {
          from: account.address,
          to: contractAddress,
          gas: 200000,
          data: contract.methods.getRefund(ticketQuantity).encodeABI()
        };
        
        const receipt = await web3.eth.sendTransaction(tx);
        
        // Update ticket balance after refund
        await getTicketBalance(wallet.address);
        
        setNotification({
          success: true,
          message: `Successfully refunded ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.transactionHash}`
        });
      }
      
      setShowNotification(true);
    } catch (error) {
      let errorMessage = error.message;
      
      // Better error handling for specific contract errors
      if (errorMessage.includes("Not enough balance to give a refund")) {
        errorMessage = "The venue appears to have withdrawn funds from the contract. Unfortunately, there's not enough ETH in the contract to process your refund. Please contact the venue directly to resolve this issue.";
      }
      
      setNotification({
        success: false,
        message: `Failed to process refund: ${errorMessage}`
      });
      setShowNotification(true);
    } finally {
      setIsRefunding(false);
    }
  };

  // Modify the ticket quantity handling
  const incrementQuantity = () => {
    if (ticketQuantity < ticketBalance) {
      setTicketQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (ticketQuantity > 1) {
      setTicketQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    
    // Ensure input is a valid number
    if (isNaN(value)) {
      return;
    }
    
    // Enforce min/max limits
    if (value >= 1 && value <= ticketBalance) {
      setTicketQuantity(value);
    } else if (value < 1) {
      setTicketQuantity(1);
    } else if (value > ticketBalance) {
      setTicketQuantity(ticketBalance);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  return (
    <>
      <PageTitle>Refund Tickets</PageTitle>
      <SubTitle>Get a refund for your tickets</SubTitle>
      
      {!walletInfo ? (
        <>
          <ConnectionToggle>
            <ToggleOption 
              active={connectionMethod === 'keystore'} 
              onClick={() => setConnectionMethod('keystore')}
            >
              Keystore File
            </ToggleOption>
            <ToggleOption 
              active={connectionMethod === 'metamask'} 
              onClick={() => setConnectionMethod('metamask')}
            >
              MetaMask
            </ToggleOption>
          </ConnectionToggle>
          
          {connectionMethod === 'keystore' ? (
            <>
              <FileInput 
                type="file" 
                onChange={handleFileChange} 
              />
              
              <PasswordInput 
                type="password" 
                placeholder="Enter your wallet password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
              />
              
              <ActionButton 
                onClick={decryptWallet}
                disabled={isLoading}
              >
                {isLoading ? "Decrypting..." : "Decrypt Wallet"}
              </ActionButton>
            </>
          ) : (
            <ActionButton 
              onClick={connectMetaMask}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Connect to MetaMask"}
            </ActionButton>
          )}
        </>
      ) : (
        <>
          <DetailsBox 
            title="Wallet Address" 
            value={walletInfo.address} 
            copyEnabled={true}
          />
          
          <DetailsBox 
            title="Ticket Balance" 
            icon={<Ticket size={32} />}
            value={`${ticketBalance} ticket(s)`}
            copyEnabled={false}
          />
          
          {ticketBalance > 0 ? (
            <TicketSection>
              <WarningBox>
                <WarningIcon>⚠️</WarningIcon>
                <div>
                  <strong>Important:</strong> Refunding tickets will return {ticketPrice} ETH per ticket to your wallet.
                  This transaction requires gas fees. The refund process cannot be undone.
                </div>
              </WarningBox>
              
              <SubTitle>Select Quantity to Refund:</SubTitle>
              <QuantitySelector>
                <QuantityButton 
                  onClick={decrementQuantity}
                  disabled={ticketQuantity <= 1}
                >
                  -
                </QuantityButton>
                
                <QuantityInput
                  type="number"
                  min="1"
                  max={ticketBalance}
                  value={ticketQuantity}
                  onChange={handleQuantityChange}
                />
                
                <QuantityButton 
                  onClick={incrementQuantity}
                  disabled={ticketQuantity >= ticketBalance}
                >
                  +
                </QuantityButton>
              </QuantitySelector>
              
              <TicketInfo>Refund Amount: {ticketPrice * ticketQuantity} ETH</TicketInfo>
              <TicketInfo>Available Tickets: {ticketBalance}</TicketInfo>
              
              <RefundButton 
                onClick={processRefund}
                disabled={isRefunding || ticketQuantity > ticketBalance}
              >
                {isRefunding ? "Processing..." : `Refund ${ticketQuantity} Ticket${ticketQuantity > 1 ? 's' : ''}`}
              </RefundButton>
            </TicketSection>
          ) : (
            <WarningBox>
              <WarningIcon>ℹ️</WarningIcon>
              <div>
                You don't have any tickets to refund. Please purchase tickets first.
              </div>
            </WarningBox>
          )}
        </>
      )}
      
      {showNotification && 
        <NotificationModal 
          message={notification} 
          closeModal={closeNotification}
        />
      }
    </>
  );
}

export default Refund;
