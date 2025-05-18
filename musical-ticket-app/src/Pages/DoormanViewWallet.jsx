import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ActionButton, PageTitle, PasswordInput, SubTitle} from './CreateWallet';
import { Ticket, Check, X } from "@phosphor-icons/react";
import { 
    getBalanceOf,
    isSpecialWallet, 
    WALLET_ROLES,
    isWalletRole
} from '../Utils/common';
import web3Provider from '../Utils/web3Provider';
import { useLocation } from 'react-router-dom';

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
    const [customerWalletAddress, setCustomerWalletAddress] = useState("");
    const [showNotification, setShowNotification] = useState(false);
    const [notification, setNotification] = useState({ success: false, message: "" });
    const [ticketBalance, setTicketBalance] = useState("-");
    const [isLoading, setIsLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null); 
    
    // Check if doorman wallet exists on component mount
    useEffect(() => {
        // Checks to ensure that only the doorman can access this page
        if (!doormanWallet) {
            setNotification({ success: false, message: "Doorman wallet not found. Please log in again." });
            setShowNotification(true);
        } 
        else if (!isWalletRole(doormanWallet, WALLET_ROLES.DOORMAN)) {
            setNotification({ 
                success: false, 
                message: "This wallet does not have doorman permissions." 
            });
            setShowNotification(true);
        }
    }, [doormanWallet]);

    const getTicketBalance = async (customerWalletAddress) => {
        // Validate wallet address
        if (!customerWalletAddress || !web3Provider.isValidAddress(customerWalletAddress)) {
            setNotification({ success: false, message: "Please enter a valid wallet address" });
            setShowNotification(true);
            setVerificationStatus(null);
            return;
        }
        
        // Check if the address is a special wallet (venue or doorman)
        // These cannot be checked, only the customer wallets
        if (isSpecialWallet(customerWalletAddress)) {
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
        
        try {
            // Use the helper function instead of direct contract call
            const balance = await getBalanceOf(customerWalletAddress);
            setTicketBalance(balance);
            
            // Verify if the wallet has at least one ticket (balance > 0)
            const hasTicket = Number(balance) > 0;
            setVerificationStatus(hasTicket);
            
            // Set notification as to whether they can be admitted or not
            // If the balance is greater than 0, the customer can be admitted
            // If the balance is 0, the customer cannot be admitted
            if (hasTicket) {
                setNotification({ 
                    success: true, 
                    message: "Valid ticket found! Customer can be admitted." 
                });
            } else {
                setNotification({ 
                    success: false, 
                    message: "No valid ticket found for this wallet address."
                });  
            }
            setShowNotification(true);
            
        } catch (error) {
            console.error("Error fetching ticket balance:", error);
            setNotification({ success: false, message: error.message });
            setShowNotification(true);
            setVerificationStatus(null);
        } finally {
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
            value={customerWalletAddress}
            onChange={(e) => setCustomerWalletAddress(e.target.value)}
        />

        <ActionButton onClick={() => getTicketBalance(customerWalletAddress)} disabled={isLoading}>
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