import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import WalletBalancesTable from '../Components/WalletBalancesTable';
import VenueActions from '../Components/VenueActions';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {PageTitle,SubTitle } from './CreateWallet';
import { 
    getTicketPrice, 
    getTotalTokensSold, 
    getTotalSupply, 
    getBalanceOf,
    getPastTransferEvents,
    WALLET_ROLES,
    isWalletRole,
    contractAddress
} from '../Utils/common.js';
import web3Provider from '../Utils/web3Provider';
import { CurrencyEth, ShoppingCartSimple, Wallet, Ticket } from "@phosphor-icons/react";
import { useLocation } from 'react-router-dom';

const LoadingIndicator = styled.div`
    margin-top: 20px;
    text-align: center;
    color: #666;
    font-style: italic;
`;

function VenueViewWallet() {
    const location = useLocation();
    const venueWalletFromState = location.state?.walletAddress;
    
    const [notification, setNotification] = useState({ success: false, message: "" });
    const [showNotification, setShowNotification] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Contract information state
    const [ticketPrice, setTicketPrice] = useState("-");
    const [totalSold, setTotalSold] = useState("-");
    const [totalSupply, setTotalSupply] = useState("-");
    const [walletBalances, setWalletBalances] = useState([]);
    const [venueEthBalance, setVenueEthBalance] = useState("-");
    const [contractEthBalance, setContractEthBalance] = useState("-");

    // Check if venue wallet exists and load data on component mount
    useEffect(() => {
        // Check if wallet exists
        if (!venueWalletFromState) {
            setNotification({ success: false, message: "Venue wallet not found. Please log in again." });
            setShowNotification(true);
            return;
        }

        // Verify the wallet is actually a venue wallet
        if (!isWalletRole(venueWalletFromState, WALLET_ROLES.VENUE)) {
            setNotification({ 
                success: false, 
                message: "This wallet does not have venue permissions." 
            });
            setShowNotification(true);
            return;
        }
        
        // Load all contract information
        loadContractInfo();
        fetchWalletBalances();
        getVenueETHBalance();
        getContractETHBalance();
    }, [venueWalletFromState]);

    const getVenueETHBalance = async () => {
        // Get the total eth from the venue wallet
        try {
            const web3 = web3Provider.getWeb3();
            const balanceWei = await web3.eth.getBalance(venueWalletFromState);
            const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
            setVenueEthBalance(parseFloat(balanceEth).toFixed(4));
        } catch (error) {
            console.error("Error fetching venue ETH balance:", error);
            setVenueEthBalance("Error");
        }
    }

    const getContractETHBalance = async () => {

        // Get the total eth from the contract
        try {
            const web3 = web3Provider.getWeb3();
            const balanceWei = await web3.eth.getBalance(contractAddress);
            const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
            setContractEthBalance(parseFloat(balanceEth).toFixed(4));
        } catch (error) {
            console.error("Error fetching contract ETH balance:", error);
            setContractEthBalance("Error");
        }
    }

    const loadContractInfo = async () => {
        setIsLoading(true);
        setShowNotification(false);
        
        try {
            // Get contract information
            const priceEth = await getTicketPrice();
            const tokensSold = await getTotalTokensSold();
            const supply = await getTotalSupply();
            
            
            // Update state with fetched information
            setTicketPrice(priceEth);
            setTotalSold(tokensSold);
            setTotalSupply(supply);
            
        } catch (error) {
            console.error("Error loading contract info:", error);
            setNotification({ 
                success: false, 
                message: `Error loading contract information: ${error.message || "Unknown error"}`
            });
            setShowNotification(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchWalletBalances = async () => {
        setIsLoading(true);
        
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
                    isVenue: address.toLowerCase() === venueWalletFromState.toLowerCase(),
                    notes: ""
                };
            });
            
            const balances = await Promise.all(balancesPromises);
            
            // Filter out zero balances and sort by balance descending
            const filteredBalances = balances
                .filter(item => parseFloat(item.balance) > 0)
                .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
                
            setWalletBalances(filteredBalances);
            
        } catch (error) {
            console.error("Error fetching wallet balances:", error);
            setNotification({
                success: false,
                message: "Error fetching wallet balances: " + error.message
            });
            setShowNotification(true);
        } finally {
            setIsLoading(false);
        }
    };

    const closeNotification = () => {
        setShowNotification(false);
    }

    const refreshBalances = () => {
        fetchWalletBalances();
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
            <DetailsBox title={"Venue ETH Balance"} icon={<CurrencyEth size={32} />} copyEnabled={false} value={`${venueEthBalance} ETH`} />
            <DetailsBox title={"Contract ETH Balance"} icon={<CurrencyEth size={32} />} copyEnabled={false} value={`${contractEthBalance} ETH`} />
            
            {/* Add the new VenueActions component here */}
            <SubTitle>Contract Management</SubTitle>
            <VenueActions />
            
            {/* Ticket Statistics Section */}
            <SubTitle>Ticket Statistics</SubTitle>
            <DetailsBox title={"Ticket Price"} icon={<CurrencyEth size={32} />} copyEnabled={false} value={`${ticketPrice} ETH`} />
            <DetailsBox 
                title={"Total Tickets In Circulation"} 
                icon={<Ticket size={32} />} 
                copyEnabled={false} 
                value={totalSupply} 
            />
            <DetailsBox 
                title={"Tickets Currently Sold"} 
                icon={<ShoppingCartSimple size={32} />} 
                copyEnabled={false} 
                value={totalSold} 
            />

            {/* Ticket Holders Section */}
            <SubTitle>Ticket Holders</SubTitle>
            <WalletBalancesTable 
                walletBalances={walletBalances}
                isLoading={isLoading}
                refreshBalances={refreshBalances} 
                excludeVenue={true}
            />
            
            {isLoading && <LoadingIndicator>Loading information...</LoadingIndicator>}
            {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
        </>
    );
}

export default VenueViewWallet;