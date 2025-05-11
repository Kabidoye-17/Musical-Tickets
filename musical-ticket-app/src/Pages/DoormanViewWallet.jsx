import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Web3 from 'web3';
import { ActionButton, PageTitle, PasswordInput, SubTitle} from './CreateWallet';
import { Ticket, Check, X } from "@phosphor-icons/react";
import { ABI, contractAddress, sepoliaRPC} from '../common.js';
import { useLocation } from 'react-router-dom';
import CryptoJS from 'crypto-js';

const VerificationStatus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  padding: 15px;
  border-radius: 10px;
  background-color: ${props => props.verified ? '#e6ffe6' : props.verified === false ? '#ffe6e6' : 'transparent'};
  color: ${props => props.verified ? '#006600' : props.verified === false ? '#cc0000' : '#333'};
  transition: all 0.3s ease;
  max-width: 400px;
  width: 100%;
`;

const StatusIcon = styled.div`
  font-size: 48px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatusMessage = styled.h2`
  font-size: 1.5rem;
  text-align: center;
  margin: 10px 0;
`;

function DoormanViewWallet() {
    const location = useLocation();
    const doormanWallet = location.state?.walletAddress;
    const [walletAddress, setWalletAddress] = useState("");
    const [showNotification, setShowNotification] = useState(false);
    const [notification, setNotification] = useState({ success: false, message: "" });
    const [ticketBalance, setTicketBalance] = useState("-");
    const [isLoading, setIsLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null); // null, true, or false
    
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
            setVerificationStatus(null);
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
            setVerificationStatus(null);
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
            
            // Verify if the wallet has at least one ticket (balance > 0)
            const hasTicket = Number(convertedBalance) > 0;
            setVerificationStatus(hasTicket);
            
            if (hasTicket) {
            setNotification({ 
                success: true, 
                message:  "Valid ticket found! Customer can be admitted." 

            });
            } else {
                setNotification({ 
                    success: false, 
                    message:  "No valid ticket found for this wallet address."
    
                });  
            }
            setShowNotification(true);
            
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching ticket balance:", error);
            setNotification({ success: false, message: error.message });
            setShowNotification(true);
            setVerificationStatus(null);
            setIsLoading(false);
        }
    }

    const closeNotification = () => {
        setShowNotification(false);
    }
    
    return (
        <>
        <PageTitle>Welcome Doorman</PageTitle>
        <SubTitle>Verify customer tickets</SubTitle>
        <PasswordInput
            type="text"
            placeholder="Enter customer's wallet address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
        />

        <ActionButton onClick={() => getTicketBalance(walletAddress)} disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Ticket"}
        </ActionButton>

        {verificationStatus !== null && (
            <VerificationStatus verified={verificationStatus}>
                <StatusIcon>
                    {verificationStatus 
                        ? <Check size={64} weight="bold" color="#006600" /> 
                        : <X size={64} weight="bold" color="#cc0000" />
                    }
                </StatusIcon>
                <StatusMessage>
                    {verificationStatus 
                        ? "ADMIT CUSTOMER" 
                        : "NO VALID TICKET"
                    }
                </StatusMessage>
            </VerificationStatus>
        )}

        <DetailsBox title={"Ticket Balance"} icon={<Ticket size={32} />} copyEnabled={false} value={ticketBalance}/>
        
        {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
        </>
    );
}

export default DoormanViewWallet;