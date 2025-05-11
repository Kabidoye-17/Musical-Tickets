import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Web3 from 'web3';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { ActionButton, PageTitle, PasswordInput, SubTitle } from './CreateWallet';
import { ABI, contractAddress, sepoliaRPC } from '../common.js';
import { CurrencyEth, ShoppingCartSimple, ChartPie, Wallet } from "@phosphor-icons/react";
import CryptoJS from 'crypto-js';
import { useLocation } from 'react-router-dom';

// Add styled components for withdraw section
const WithdrawSection = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

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

const FileInput = styled(PasswordInput)`
  padding: 10px;
`;

const WithdrawButton = styled(ActionButton)`
  background-color: #28a745;
  
  &:hover {
    background-color: #218838;
  }
`;

function VenueViewWallet() {
    const location = useLocation();
    const venueWalletFromState = location.state?.walletAddress;
    
    const [walletAddress, setWalletAddress] = useState("");
    const [notification, setNotification] = useState("");
    const [showNotification, setShowNotification] = useState(false);
    const [ticketBalance, setTicketBalance] = useState("-");
    const [cryptoBalance, setCryptoBalance] = useState("-");
    const [isLoading, setIsLoading] = useState(false);
    
    // New state variables for contract information
    const [ticketPrice, setTicketPrice] = useState("-");
    const [totalSold, setTotalSold] = useState("-");
    const [totalSupply, setTotalSupply] = useState("-");

    // Add new state variables for ETH balances
    const [contractBalance, setContractBalance] = useState("-");
    const [venueBalance, setVenueBalance] = useState("-");
    const [venueAddress, setVenueAddress] = useState(venueWalletFromState || "");
    
    // New state for withdraw functionality
    const [showWithdrawSection, setShowWithdrawSection] = useState(false);
    const [connectionMethod, setConnectionMethod] = useState('keystore');
    const [keystoreFile, setKeystoreFile] = useState(null);
    const [password, setPassword] = useState('');
    const [wallet, setWallet] = useState(null);
    const [walletInfo, setWalletInfo] = useState(null);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // Authorization hashes for validation
    const authorizedHashes = {
        [process.env.REACT_APP_VENUE_HASH]: "venue",
    };

    const hashWalletAddress = (address) => {
        return CryptoJS.SHA256(address.trim().toLowerCase()).toString();
    };

    // Check if venue wallet exists on component mount
    useEffect(() => {
        if (!venueWalletFromState) {
            setNotification({ success: false, message: "Venue wallet not found. Please log in again." });
            setShowNotification(true);
        }
    }, [venueWalletFromState]);
    
    // Load contract information on component mount
    useEffect(() => {
        loadContractInfo();
    }, []);

    const loadContractInfo = async () => {
        setIsLoading(true);
        
        try {
            const web3 = new Web3(sepoliaRPC);
            const contract = new web3.eth.Contract(ABI, contractAddress);
            
            // Get ticket price
            const priceWei = await contract.methods.getTicketPrice().call();
            const priceEth = web3.utils.fromWei(priceWei, 'ether');
            setTicketPrice(priceEth);
            
            // Get total tokens sold
            const tokensSold = await contract.methods.getTotalTokensSold().call();
            const tokensSoldEth = web3.utils.fromWei(tokensSold, 'ether');
            setTotalSold(tokensSoldEth);
            
            // Get total supply
            const supply = await contract.methods.totalSupply().call();
            const supplyEth = web3.utils.fromWei(supply, 'ether');
            setTotalSupply(supplyEth);
            
            // Get contract ETH balance
            const contractBalanceWei = await web3.eth.getBalance(contractAddress);
            const contractBalanceEth = web3.utils.fromWei(contractBalanceWei, 'ether');
            setContractBalance(contractBalanceEth);
            
            // If venueAddress is not set from state, get it from the contract
            if (!venueAddress) {
                const venue = await contract.methods.venue().call();
                setVenueAddress(venue);
            }
            
            // Get venue ETH balance using venueAddress from state if available
            const venueBalanceWei = await web3.eth.getBalance(venueAddress || venueWalletFromState);
            const venueBalanceEth = web3.utils.fromWei(venueBalanceWei, 'ether');
            setVenueBalance(venueBalanceEth);
            
            setNotification({ 
                success: true, 
                message: "Contract information loaded successfully" 
            });
        } catch (error) {
            console.error("Error loading contract info:", error);
            setNotification({ 
                success: false, 
                message: "Error loading contract information: " + error.message 
            });
            setShowNotification(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle file change for keystore file upload
    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setKeystoreFile(e.target.files[0]);
        }
    };

    // Connect with MetaMask
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
            
            // Check if the wallet is the venue wallet - if we have the address from state, use it for direct comparison
            if (venueWalletFromState && venueWalletFromState.toLowerCase() !== address.toLowerCase()) {
                setNotification({
                    success: false,
                    message: `Only the venue wallet can withdraw funds. This wallet doesn't match the venue wallet.`
                });
                setShowNotification(true);
                setIsLoading(false);
                return;
            }
            
            // Otherwise check via hash
            const hashedAddress = hashWalletAddress(address);
            const role = authorizedHashes[hashedAddress];
            
            if (!role || role !== 'venue') {
                setNotification({
                    success: false,
                    message: `Only the venue wallet can withdraw funds. This wallet doesn't have permission.`
                });
                setShowNotification(true);
                setIsLoading(false);
                return;
            }
            
            // Create a provider to interact with MetaMask (Ethers v6 syntax)
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

    // Decrypt wallet from keystore file
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
                    
                    // Check if the wallet is the venue wallet
                    const hashedAddress = hashWalletAddress(decryptedWallet.address);
                    const role = authorizedHashes[hashedAddress];
                    
                    if (!role || role !== 'venue') {
                        setNotification({
                            success: false,
                            message: `Only the venue wallet can withdraw funds. This wallet doesn't have permission.`
                        });
                        setShowNotification(true);
                        setIsLoading(false);
                        return;
                    }
                    
                    setWallet(decryptedWallet); // Store the wallet object for later use
                    setWalletInfo({
                        address: decryptedWallet.address,
                        privateKey: decryptedWallet.privateKey
                    });
                    setNotification({ 
                        success: true, 
                        message: "Venue wallet decrypted successfully!" 
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

    // Withdraw funds from contract
    const withdrawFunds = async () => {
        if (!wallet) {
            setNotification({
                success: false,
                message: "Wallet not available. Please connect to your wallet first."
            });
            setShowNotification(true);
            return;
        }

        setIsWithdrawing(true);

        try {
            if (connectionMethod === 'metamask') {
                // Using MetaMask with Ethers v6
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const contract = new Contract(contractAddress, ABI, signer);
                
                // Call the withdraw method
                const tx = await contract.withdraw();
                const receipt = await tx.wait();
                
                setNotification({
                    success: true,
                    message: `Successfully withdrew funds! Transaction hash: ${receipt.transactionHash}`
                });
                
                // Refresh contract info after withdrawal
                loadContractInfo();
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
                    data: contract.methods.withdraw().encodeABI()
                };
                
                const receipt = await web3.eth.sendTransaction(tx);
                
                setNotification({
                    success: true,
                    message: `Successfully withdrew funds! Transaction hash: ${receipt.transactionHash}`
                });
                
                // Refresh contract info after withdrawal
                loadContractInfo();
            }
            
            setShowNotification(true);
        } catch (error) {
            setNotification({
                success: false,
                message: `Failed to withdraw funds: ${error.message}.`
            });
            setShowNotification(true);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const displayWalletDetails = (walletAddress) => {
        const web3 = new Web3("https://sepolia.infura.io/v3/6f6f1ab124ff4449869f5df930ae6fd4");
    
        if (web3.utils.isAddress(walletAddress)){
            setIsLoading(true);
            
            // Fetch ETH balance
            web3.eth.getBalance(walletAddress)
                .then(function(balance) {                    
                    const balanceInEther = web3.utils.fromWei(balance, "ether");
                    setCryptoBalance(balanceInEther);
                    
                    setTicketBalance("0");
                })
                .catch(error => {
                    setNotification({ 
                        success: false, 
                        message: "Error fetching balances: " + error.message 
                    });
                    setShowNotification(true);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setNotification({ 
                success: false, 
                message: "Invalid wallet address format" 
            });
            setShowNotification(true);
            return;
        }
    }

    const closeNotification = () => {
        setShowNotification(false);
    }

    return (
        <>
            <PageTitle>Welcome Venue</PageTitle>
            <SubTitle>Musical Ticket Contract Information</SubTitle>
            
            {venueWalletFromState && (
                <DetailsBox 
                    title={"Venue Wallet"} 
                    icon={<Wallet size={32} />} 
                    copyEnabled={true} 
                    value={venueWalletFromState}
                />
            )}
            
            <DetailsBox title={"Ticket Price"} icon={<CurrencyEth size={32} />} copyEnabled={false} value={`${ticketPrice} ETH`} />
            <DetailsBox title={"Tickets Sold"} icon={<ShoppingCartSimple size={32} />} copyEnabled={false} value={totalSold} />
            <DetailsBox title={"Total Supply"} icon={<ChartPie size={32} />} copyEnabled={false} value={totalSupply} />
            <DetailsBox title={"Contract Balance"} icon={<Wallet size={32} />} copyEnabled={false} value={`${contractBalance} ETH`} />
            <DetailsBox 
                title={"Venue Balance"} 
                icon={<Wallet size={32} />} 
                copyEnabled={false} 
                value={`${venueBalance} ETH`}
                subtitle={venueAddress ? `${venueAddress.substring(0, 6)}...${venueAddress.substring(venueAddress.length - 4)}` : ""}
            />
            
            {!showWithdrawSection && (
                <ActionButton onClick={() => setShowWithdrawSection(true)} style={{ marginTop: '20px' }}>
                    Withdraw Funds to Venue
                </ActionButton>
            )}
            
            {showWithdrawSection && (
                <WithdrawSection>
                    <SubTitle>Withdraw Contract Balance to Venue</SubTitle>
                    
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
                                        placeholder="Enter your venue wallet password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)} 
                                    />
                                    
                                    <ActionButton 
                                        onClick={decryptWallet}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Decrypting..." : "Decrypt Venue Wallet"}
                                    </ActionButton>
                                </>
                            ) : (
                                <ActionButton 
                                    onClick={connectMetaMask}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Connecting..." : "Connect Venue Wallet with MetaMask"}
                                </ActionButton>
                            )}
                        </>
                    ) : (
                        <>
                            <DetailsBox 
                                title="Connected Venue Wallet" 
                                value={walletInfo.address} 
                                copyEnabled={true}
                            />
                            
                            <WithdrawButton 
                                onClick={withdrawFunds}
                                disabled={isWithdrawing || contractBalance === "0"}
                            >
                                {isWithdrawing ? "Processing Withdrawal..." : `Withdraw ${contractBalance} ETH to Venue`}
                            </WithdrawButton>
                        </>
                    )}
                </WithdrawSection>
            )}
            
            {isLoading && <LoadingIndicator>Loading contract information...</LoadingIndicator>}
            {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
        </>
    );
}

const LoadingIndicator = styled.div`
    margin-top: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
`;

export default VenueViewWallet;