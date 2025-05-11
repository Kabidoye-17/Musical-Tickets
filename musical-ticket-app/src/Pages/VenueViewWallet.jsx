import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import WalletBalancesTable from '../Components/WalletBalancesTable';
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Web3 from 'web3';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { ActionButton, PageTitle, PasswordInput, SubTitle } from './CreateWallet';
import { ABI, contractAddress, sepoliaRPC } from '../common.js';
import { CurrencyEth, ShoppingCartSimple, ChartPie, Wallet, Ticket } from "@phosphor-icons/react";
import CryptoJS from 'crypto-js';
import { useLocation } from 'react-router-dom';

// Only keep the LoadingIndicator styled component
const LoadingIndicator = styled.div`
    margin-top: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
`;

// Add a debounce function helper
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

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

    // New state variables for ETH balances
    const [contractBalance, setContractBalance] = useState("-");
    const [venueBalance, setVenueBalance] = useState("-");
    const [venueAddress, setVenueAddress] = useState(venueWalletFromState || "");
    
    // New state variables for ticket statistics
    const [remainingTickets, setRemainingTickets] = useState("-");
    const [searchedWalletBalance, setSearchedWalletBalance] = useState(null);
    const [walletBalances, setWalletBalances] = useState([]);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);

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
    
    // Load contract information and fetch wallet balances on component mount
    useEffect(() => {
        loadContractInfo();
        debouncedFetchWalletBalances();
    }, []);

    const loadContractInfo = async () => {
        setIsLoading(true);
        
        // Clear any existing notifications before starting
        setShowNotification(false);
        
        try {
            console.log("Connecting to Sepolia RPC:", sepoliaRPC);
            const web3 = new Web3(sepoliaRPC);
            
            // Verify connection to the network
            try {
                await web3.eth.net.isListening();
                console.log("Successfully connected to Ethereum network");
            } catch (connectionError) {
                throw new Error(`Failed to connect to Ethereum network: ${connectionError.message}`);
            }
            
            console.log("Creating contract instance with address:", contractAddress);
            const contract = new web3.eth.Contract(ABI, contractAddress);
            
            // Get ticket price
            try {
                const priceWei = await contract.methods.getTicketPrice().call();
                const priceEth = web3.utils.fromWei(priceWei, 'ether');
                setTicketPrice(priceEth);
                console.log("Ticket Price:", priceEth, "ETH");
            } catch (priceError) {
                throw new Error(`Failed to get ticket price: ${priceError.message}`);
            }
            
            // Get total tokens sold
            try {
                const tokensSold = await contract.methods.getTotalTokensSold().call();
                const tokensSoldEth = web3.utils.fromWei(tokensSold, 'ether');
                setTotalSold(tokensSoldEth);
                console.log("Total Sold:", tokensSoldEth);
            } catch (soldError) {
                throw new Error(`Failed to get total tokens sold: ${soldError.message}`);
            }
            
            // Get total supply
            try {
                const supply = await contract.methods.totalSupply().call();
                const supplyEth = web3.utils.fromWei(supply, 'ether');
                setTotalSupply(supplyEth);
                console.log("Total Supply:", supplyEth);
            } catch (supplyError) {
                throw new Error(`Failed to get total supply: ${supplyError.message}`);
            }
            
            // Get contract ETH balance
            try {
                const contractBalanceWei = await web3.eth.getBalance(contractAddress);
                const contractBalanceEth = web3.utils.fromWei(contractBalanceWei, 'ether');
                setContractBalance(contractBalanceEth);
                console.log("Contract Balance:", contractBalanceEth, "ETH");
            } catch (balanceError) {
                throw new Error(`Failed to get contract balance: ${balanceError.message}`);
            }
            
            // If venueAddress is not set from state, get it from the contract
            if (!venueAddress) {
                try {
                    const venue = await contract.methods.venue().call();
                    setVenueAddress(venue);
                    console.log("Venue Address from contract:", venue);
                } catch (venueError) {
                    throw new Error(`Failed to get venue address: ${venueError.message}`);
                }
            }
            
            // Get venue ETH balance using venueAddress from state if available
            try {
                const venueAddrToUse = venueAddress || venueWalletFromState;
                console.log("Getting balance for venue address:", venueAddrToUse);
                const venueBalanceWei = await web3.eth.getBalance(venueAddrToUse);
                const venueBalanceEth = web3.utils.fromWei(venueBalanceWei, 'ether');
                setVenueBalance(venueBalanceEth);
                console.log("Venue ETH Balance:", venueBalanceEth, "ETH");
            } catch (venueBalanceError) {
                throw new Error(`Failed to get venue ETH balance: ${venueBalanceError.message}`);
            }
            
            // Get remaining tickets (venue's token balance)
            try {
                const venueAddrToUse = venueAddress || venueWalletFromState;
                console.log("Checking ticket balance for venue address:", venueAddrToUse);
                
                // First verify if the venue address is valid
                if (!venueAddrToUse || !web3.utils.isAddress(venueAddrToUse)) {
                    throw new Error("Invalid venue address");
                }
                
                // Try to get ticket balance using direct call for better error reporting
                try {
                    const venueTicketBalanceWei = await contract.methods.balanceOf(venueAddrToUse).call();
                    const venueTicketBalanceEth = web3.utils.fromWei(venueTicketBalanceWei, 'ether');
                    setRemainingTickets(venueTicketBalanceEth);
                    console.log("Remaining Tickets:", venueTicketBalanceEth);
                } catch (directCallError) {
                    console.error("Direct balanceOf call error:", directCallError);
                    
                    // Fallback: Try an alternative approach - if this is a known issue with some Web3 implementations
                    try {
                        // Set a placeholder value for now
                        console.log("Using fallback approach for remaining tickets");
                        setRemainingTickets("Data unavailable");
                        
                        // We could still try to calculate this from totalSupply and totalSold
                        // But we'll avoid potential math errors by using a placeholder
                    } catch (fallbackError) {
                        throw new Error(`Fallback approach also failed: ${fallbackError.message}`);
                    }
                }
            } catch (ticketBalanceError) {
                console.error("Ticket balance error details:", ticketBalanceError);
                // Don't throw here, just log the error and continue
                console.warn(`Unable to get venue ticket balance: ${ticketBalanceError.message}`);
                setRemainingTickets("Error loading");
            }
            
            // Only prepare the success notification, but don't show it immediately
            // This prevents the flickering notification
            debouncedSetNotification({ 
                success: true, 
                message: "Contract information loaded successfully" 
            }, false); // Don't show success notification
            
        } catch (error) {
            console.error("Error loading contract info:", error);
            const errorMessage = error.message || "Unknown error";
            
            // Use setTimeout to delay the error notification
            debouncedSetNotification({ 
                success: false, 
                message: `Error loading contract information: ${errorMessage}`
            }, true);
        } finally {
            setIsLoading(false);
        }
    };

    // New function to fetch wallet balances from Transfer events
    const fetchWalletBalances = async () => {
        setIsLoadingBalances(true);
        
        // Clear any existing notifications
        setShowNotification(false);
        
        try {
            const web3 = new Web3(sepoliaRPC);
            const contract = new web3.eth.Contract(ABI, contractAddress);
            
            // Get past Transfer events to identify addresses with balances
            const pastEvents = await contract.getPastEvents('Transfer', {
                fromBlock: 0,
                toBlock: 'latest'
            });
            
            // Extract unique addresses from events
            const addressSet = new Set();
            pastEvents.forEach(event => {
                addressSet.add(event.returnValues.from);
                addressSet.add(event.returnValues.to);
            });
            
            // Remove the zero address (used for minting)
            addressSet.delete('0x0000000000000000000000000000000000000000');
            
            // Get balances for each address
            const balancesPromises = Array.from(addressSet).map(async (address) => {
                const balance = await contract.methods.balanceOf(address).call();
                return {
                    address,
                    balance: web3.utils.fromWei(balance, 'ether'),
                    isVenue: address.toLowerCase() === (venueAddress || venueWalletFromState).toLowerCase(),
                    notes: ""
                };
            });
            
            const balances = await Promise.all(balancesPromises);
            
            // Filter out zero balances and sort by balance descending
            const filteredBalances = balances
                .filter(item => parseFloat(item.balance) > 0)
                .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
                
            setWalletBalances(filteredBalances);
            
            // Don't show success notifications to reduce UI noise
            
        } catch (error) {
            console.error("Error fetching wallet balances:", error);
            
            // Add delay for error notifications
            debouncedSetNotification({
                success: false,
                message: "Error fetching wallet balances: " + error.message
            }, true);
        } finally {
            setIsLoadingBalances(false);
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

    // Debounced notification handler
    const debouncedSetNotification = useCallback(
        debounce((notificationData, shouldShow) => {
            setNotification(notificationData);
            if (shouldShow) {
                setShowNotification(true);
            }
        }, 500), // 500ms debounce time
        []
    );
    
    // Debounced data fetching
    const debouncedFetchWalletBalances = useCallback(
        debounce(() => {
            fetchWalletBalancesImplementation();
        }, 300),
        [venueAddress, venueWalletFromState] // Add dependencies that might change
    );
    
    // Move the implementation to a separate function
    const fetchWalletBalancesImplementation = async () => {
        setIsLoadingBalances(true);
        
        // Clear any existing notifications
        setShowNotification(false);
        
        try {
            const web3 = new Web3(sepoliaRPC);
            const contract = new web3.eth.Contract(ABI, contractAddress);
            
            // Get past Transfer events to identify addresses with balances
            const pastEvents = await contract.getPastEvents('Transfer', {
                fromBlock: 0,
                toBlock: 'latest'
            });
            
            // Extract unique addresses from events
            const addressSet = new Set();
            pastEvents.forEach(event => {
                addressSet.add(event.returnValues.from);
                addressSet.add(event.returnValues.to);
            });
            
            // Remove the zero address (used for minting)
            addressSet.delete('0x0000000000000000000000000000000000000000');
            
            // Get balances for each address
            const balancesPromises = Array.from(addressSet).map(async (address) => {
                const balance = await contract.methods.balanceOf(address).call();
                return {
                    address,
                    balance: web3.utils.fromWei(balance, 'ether'),
                    isVenue: address.toLowerCase() === (venueAddress || venueWalletFromState).toLowerCase(),
                    notes: ""
                };
            });
            
            const balances = await Promise.all(balancesPromises);
            
            // Filter out zero balances and sort by balance descending
            const filteredBalances = balances
                .filter(item => parseFloat(item.balance) > 0)
                .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
                
            setWalletBalances(filteredBalances);
            
            // Don't show success notifications to reduce UI noise
            
        } catch (error) {
            console.error("Error fetching wallet balances:", error);
            
            // Use the debounced notification setter
            debouncedSetNotification({
                success: false,
                message: "Error fetching wallet balances: " + error.message
            }, true);
        } finally {
            setIsLoadingBalances(false);
        }
    };

    // Update the refresh function to use debounced version
    const refreshBalances = () => {
        debouncedFetchWalletBalances();
    };

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
            
            {/* Ticket Statistics Section */}
            <SubTitle>Ticket Statistics</SubTitle>
            <DetailsBox 
                title={"Total Tickets In Circulation"} 
                icon={<Ticket size={32} />} 
                copyEnabled={false} 
                value={totalSupply} 
            />
            <DetailsBox 
                title={"Tickets Sold Overtime"} 
                icon={<ShoppingCartSimple size={32} />} 
                copyEnabled={false} 
                value={totalSold} 
            />
            <DetailsBox 
                title={"Unsold Tickets"} 
                icon={<Ticket size={32} />} 
                copyEnabled={false} 
                value={remainingTickets}
                subtitle="Tickets still held by venue" 
            />
            
            {/* Use the new WalletBalancesTable component */}
            <SubTitle>Ticket Holders</SubTitle>
            <WalletBalancesTable 
                walletBalances={walletBalances}
                isLoading={isLoadingBalances}
                refreshBalances={refreshBalances} // Use the debounced refresh function
                excludeVenue={true}
            />
            
            <SubTitle>Financial Information</SubTitle>
            <DetailsBox title={"Sales Revenue"} icon={<Wallet size={32} />} copyEnabled={false} value={`${contractBalance} ETH`} />
            
            {(isLoading || isLoadingBalances) && <LoadingIndicator>Loading information...</LoadingIndicator>}
            {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
        </>
    );
}

export default VenueViewWallet;