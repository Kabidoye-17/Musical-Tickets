import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Web3 from 'web3';
import { ActionButton, PageTitle, PasswordInput, SubTitle} from './CreateWallet';
import { Ticket } from "@phosphor-icons/react";
import { ABI, contractAddress, sepoliaRPC} from '../common.js';
import { useLocation } from 'react-router-dom';
import CryptoJS from 'crypto-js';

function DoormanViewWallet() {
    const location = useLocation();
    const doormanWallet = location.state?.walletAddress;
    const [walletAddress, setWalletAddress] = useState("");
    const [showNotification, setShowNotification] = useState(false);
    const [notification, setNotification] = useState({ success: false, message: "" });
    const [ticketBalance, setTicketBalance] = useState("-");
    const [isLoading, setIsLoading] = useState(false);
    
    const authorizedHashes = {
        [process.env.REACT_APP_VENUE_HASH]: "venue",
        [process.env.REACT_APP_DOORMAN_HASH]: "doorman",
    };
    
    const hashWalletAddress = (address) => {
        return CryptoJS.SHA256(address.trim().toLowerCase()).toString();
    };
    
    // Check if doorman wallet exists on component mount
    useEffect(() => {
        if (!doormanWallet) {
            setNotification({ success: false, message: "Doorman wallet not found. Please log in again." });
            setShowNotification(true);
        }
    }, []);

    const getTicketBalance = async (walletAddress) => {
        // Validate wallet address
        if (!walletAddress || !Web3.utils.isAddress(walletAddress)) {
            setNotification({ success: false, message: "Please enter a valid wallet address" });
            setShowNotification(true);
            return;
        }
        
        // Check if the address is a protected address (venue or doorman)
        const hashedAddress = hashWalletAddress(walletAddress);
        if (authorizedHashes[hashedAddress]) {
            setNotification({ 
                success: false, 
                message: "Cannot check balance of venue or doorman wallets."
            });
            setShowNotification(true);
            return;
        }
        
        // Set loading state
        setIsLoading(true);
        
        const web3 = new Web3(sepoliaRPC);
        const contract = new web3.eth.Contract(ABI, contractAddress);
        
        try {
            const balance = await contract.methods.balanceOf(walletAddress).call();
            
            // Convert balance from wei to ether
            const convertedBalance = Web3.utils.fromWei(balance, 'ether');
            setTicketBalance(convertedBalance);
        
            setNotification({ success: true, message: "Ticket balance fetched successfully" });
            setShowNotification(true);

            
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching ticket balance:", error);
            setNotification({ success: false, message: error.message });
            setShowNotification(true);
            setIsLoading(false);
        }
    }

    const closeNotification = () => {
        setShowNotification(false);
    }
    
    return (
        <>
        <PageTitle>Welcome Doorman</PageTitle>
        <SubTitle>View token balance of a customer</SubTitle>
        <PasswordInput
            type="text"
            placeholder="Enter wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
        />

        <ActionButton onClick={() => getTicketBalance(walletAddress)} disabled={isLoading}>
            {isLoading ? "Loading..." : "View Wallet"}
        </ActionButton>

        <DetailsBox title={"Ticket Balance"} icon={<Ticket size={32} />} copyEnabled={false} value={ticketBalance}/>
        
        {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
        </>
    );
}

export default DoormanViewWallet;