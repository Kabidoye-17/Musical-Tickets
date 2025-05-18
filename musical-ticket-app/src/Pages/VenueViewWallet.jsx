import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import WalletBalancesTable from '../Components/WalletBalancesTable';
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { ActionButton, PageTitle, PasswordInput, SubTitle } from './CreateWallet';
import { 
    getTicketPrice, 
    getTotalTokensSold, 
    getTotalSupply, 
    getVenueAddress, 
    getBalanceOf,
    getPastTransferEvents,
    contractAddress,
    WALLET_ROLES,
    isWalletRole
} from '../Utils/common.js';
import web3Provider from '../Utils/web3Provider';
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
        // Verify the wallet is actually a venue wallet
        if (venueWalletFromState && !isWalletRole(venueWalletFromState, WALLET_ROLES.VENUE)) {
            setNotification({ 
                success: false, 
                message: "This wallet does not have venue permissions." 
            });
            setShowNotification(true);
        }
        
        loadContractInfo();
        debouncedFetchWalletBalances();
    }, []);

    const loadContractInfo = async () => {
        setIsLoading(true);
        
        // Clear any existing notifications before starting
        setShowNotification(false);
        
        try {
            console.log("Connecting to Sepolia RPC");
            const web3 = web3Provider.getWeb3();
            
            // Verify connection to the network
            try {
                await web3.eth.net.isListening();
                console.log("Successfully connected to Ethereum network");
            } catch (connectionError) {
                throw new Error(`Failed to connect to Ethereum network: ${connectionError.message}`);
            }
            
            // Get ticket price
            try {
                const priceEth = await getTicketPrice();
                setTicketPrice(priceEth);
                console.log("Ticket Price:", priceEth, "ETH");
            } catch (priceError) {
                throw new Error(`Failed to get ticket price: ${priceError.message}`);
            }
            
            // Get total tokens sold
            try {
                const tokensSoldEth = await getTotalTokensSold();
                setTotalSold(tokensSoldEth);
                console.log("Total Sold:", tokensSoldEth);
            } catch (soldError) {
                throw new Error(`Failed to get total tokens sold: ${soldError.message}`);
            }
            
            // Get total supply
            try {
                const supplyEth = await getTotalSupply();
                setTotalSupply(supplyEth);
                console.log("Total Supply:", supplyEth);
            } catch (supplyError) {
                throw new Error(`Failed to get total supply: ${supplyError.message}`);
            }
            
            // Get contract ETH balance
            try {
                const contractBalanceWei = await web3Provider.getBalance(contractAddress);
                const contractBalanceEth = web3Provider.fromWei(contractBalanceWei);
                setContractBalance(contractBalanceEth);
                console.log("Contract Balance:", contractBalanceEth, "ETH");
            } catch (balanceError) {
                throw new Error(`Failed to get contract balance: ${balanceError.message}`);
            }
            
            // If venueAddress is not set from state, get it from the contract
            if (!venueAddress) {
                try {
                    const venue = await getVenueAddress();
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
                const venueBalanceEth = web3Provider.fromWei(venueBalanceWei);
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
                if (!venueAddrToUse || !web3Provider.isValidAddress(venueAddrToUse)) {
                    throw new Error("Invalid venue address");
                }
                
                // Try to get ticket balance using direct call for better error reporting
                try {
                    const venueTicketBalanceEth = await getBalanceOf(venueAddrToUse);
                    setRemainingTickets(venueTicketBalanceEth);
                    console.log("Remaining Tickets:", venueTicketBalanceEth);
                } catch (directCallError) {
                    console.error("Direct balanceOf call error:", directCallError);
                    
                    // Fallback: Try an alternative approach
                    console.log("Using fallback approach for remaining tickets");
                    setRemainingTickets("Data unavailable");
                }
            } catch (ticketBalanceError) {
                console.error("Ticket balance error details:", ticketBalanceError);
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
            // Get past Transfer events to identify addresses with balances
            const pastEvents = await getPastTransferEvents();
            
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
                const balance = await getBalanceOf(address);
                return {
                    address,
                    balance: balance,
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
        if (web3Provider.isValidAddress(walletAddress)){
            setIsLoading(true);
            
            // Fetch ETH balance
            const web3 = web3Provider.getWeb3();
            web3.eth.getBalance(walletAddress)
                .then(function(balance) {                    
                    const balanceInEther = web3Provider.fromWei(balance);
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
            // Get past Transfer events to identify addresses with balances
            const pastEvents = await getPastTransferEvents();
            
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
                const balance = await getBalanceOf(address);
                return {
                    address,
                    balance: balance,
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