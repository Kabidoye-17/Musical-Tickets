import React, { useState } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import Web3 from 'web3';
import styled from 'styled-components';
import NotificationModal from '../Components/NotificationModal';
import DetailsBox from '../Components/DetailsBox';
import { PageTitle, SubTitle, PasswordInput, ActionButton } from './CreateWallet';
import { ABI, contractAddress, sepoliaRPC } from '../common';
import CryptoJS from 'crypto-js';

const FileInput = styled(PasswordInput)`
  padding: 10px;
`;

// New styled components for connection method toggle
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
  gap: 15px;
  margin: 15px 0;
`;

const QuantityButton = styled.button`
  padding: 10px 20px;
  background-color: ${props => props.active ? '#ff9c59' : '#fff'};
  color: ${props => props.active ? '#fff' : '#333'};
  border: 2px solid #ff9c59;
  border-radius: 5px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#ff7f40' : '#fff8f3'};
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

const WarningIcon = styled.span`
  font-size: 20px;
  margin-right: 10px;
`;

function BuyTicket()  {
  const [password, setPassword] = useState('');
  const [keystoreFile, setKeystoreFile] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [wallet, setWallet] = useState(null); // Store the actual wallet object
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [notification, setNotification] = useState({ success: false, message: "" });
  const [showNotification, setShowNotification] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  // New state to track connection method
  const [connectionMethod, setConnectionMethod] = useState('keystore'); // 'keystore' or 'metamask'
  
  // Ticket price from contract (0.01 ETH)
  const ticketPrice = 0.01;
  
  // Special wallet addresses that can't purchase tickets
  const authorizedHashes = {
    [process.env.REACT_APP_VENUE_HASH]: "venue",
    [process.env.REACT_APP_DOORMAN_HASH]: "doorman",
  }

  const hashWalletAddress = (address) => {
    return CryptoJS.SHA256(address.trim().toLowerCase()).toString();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setKeystoreFile(e.target.files[0]);
    }
  };

  // New function to connect with MetaMask
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
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} wallets cannot purchase tickets. Disconnect this wallet and try again.`
        });
        setShowNotification(true);
        setIsLoading(false);
        return;
      }
      
      // Create a BrowserProvider to interact with MetaMask (Ethers v6 syntax)
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Store the wallet info
      setWalletInfo({
        address: address,
        // We don't have access to the private key with MetaMask
        privateKey: null
      });
      
      // Store the signer as our wallet object for later use
      setWallet(signer);
      
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
          
          setWallet(decryptedWallet); // Store the wallet object for later use
          setWalletInfo({
            address: decryptedWallet.address,
            privateKey: decryptedWallet.privateKey
          });
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

  const buyTickets = async () => {
    if (!wallet) {
      setNotification({
        success: false,
        message: "Wallet not available. Please connect to your wallet first."
      });
      setShowNotification(true);
      return;
    }

    // Check if wallet is a special role
    const hashedAddress = hashWalletAddress(
      connectionMethod === 'keystore' ? wallet.address : walletInfo.address
    );
    const role = authorizedHashes[hashedAddress];
    
    if (role) {
      setNotification({
        success: false,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} wallets cannot purchase tickets.`
      });
      setShowNotification(true);
      return;
    }

    setIsPurchasing(true);

    try {
      if (connectionMethod === 'metamask') {
        // Using MetaMask with Ethers v6
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(contractAddress, ABI, signer);
        
        // Calculate the total price in wei
        const totalPriceWei = ethers.parseEther((ticketPrice * ticketQuantity).toString());
        
        // Call the contract method
        const tx = await contract.buyTicket(ticketQuantity, { value: totalPriceWei });
        const receipt = await tx.wait();
        
        setNotification({
          success: true,
          message: `Successfully purchased ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.transactionHash ? receipt.transactionHash : "Check your wallet for the transaction."}`
        });
      } else {
        // Using keystore wallet - keep the existing implementation
        const web3 = new Web3(sepoliaRPC);
        const contract = new web3.eth.Contract(ABI, contractAddress);
        
        // Create a web3 account using the private key
        const account = web3.eth.accounts.privateKeyToAccount(wallet.privateKey);
        web3.eth.accounts.wallet.add(account);
        
        // Calculate the total price in wei
        const totalPriceWei = web3.utils.toWei((ticketPrice * ticketQuantity).toString(), 'ether');
        const tx = {
          from: account.address,
          to: contractAddress,
          gas: 200000,
          value: totalPriceWei,
          data: contract.methods.buyTicket(ticketQuantity).encodeABI()
        };
        
        const receipt = await web3.eth.sendTransaction(tx);
        
        setNotification({
          success: true,
          message: `Successfully purchased ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.transactionHash}`
        });
      }
      
      setShowNotification(true);
    } catch (error) {
      setNotification({
        success: false,
        message: `Failed to purchase tickets: ${error.message}. Please check your wallet balance and try again.`
      });
      setShowNotification(true);
    } finally {
      setIsPurchasing(false);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  return (
    <>
      <PageTitle>Buy Ticket</PageTitle>
      <SubTitle>Connect your wallet to purchase tickets</SubTitle>
      
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
          
          <TicketSection>
          <WarningBox>
              <WarningIcon>⚠️</WarningIcon>
              <div>
                <strong>Friendly reminder:</strong> The actual transaction cost will be slightly higher than shown due to network gas fees. 
                Make sure your wallet has enough funds to cover both the ticket price and gas!
              </div>
            </WarningBox>
            
            <TicketInfo>Ticket Price: {ticketPrice} ETH each</TicketInfo>
            
            <SubTitle>Select Quantity:</SubTitle>
            <QuantitySelector>
              <QuantityButton 
                active={ticketQuantity === 1} 
                onClick={() => setTicketQuantity(1)}
              >
                1 Ticket
              </QuantityButton>
              <QuantityButton 
                active={ticketQuantity === 2} 
                onClick={() => setTicketQuantity(2)}
              >
                2 Tickets
              </QuantityButton>
            </QuantitySelector>
            
            <TicketInfo>Total Cost: {ticketPrice * ticketQuantity} ETH</TicketInfo>
            
           
            <ActionButton 
              onClick={buyTickets}
              disabled={isPurchasing}
            >
              {isPurchasing ? "Processing..." : `Purchase ${ticketQuantity} Ticket${ticketQuantity > 1 ? 's' : ''}`}
            </ActionButton>
          </TicketSection>
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

export default BuyTicket;
