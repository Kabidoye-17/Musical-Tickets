import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Web3 from 'web3';
import { ActionButton, PageTitle, PasswordInput, SubTitle} from './CreateWallet';

function PurchaserViewWallet() {
    const location = useLocation();
    const walletAddress = location.state?.walletAddress;
    const [notification, setNotification] = useState("");
    const [showNotification, setShowNotification] = useState(false);
    const [ticketBalance, setTicketBalance] = useState("-");
    const [cryptoBalance, setCryptoBalance] = useState("-");
    const [isLoading, setIsLoading] = useState(false);


    
    useEffect(() => {
        // Skip if no wallet address is provided
        if (!walletAddress) {
            setNotification({
                success: false,
                message: "No wallet address provided"
            });
            setShowNotification(true);
            return;
        }

        const web3 = new Web3("https://sepolia.infura.io/v3/6f6f1ab124ff4449869f5df930ae6fd4");

        if (web3.utils.isAddress(walletAddress)) {
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
    }, [walletAddress]);

    const closeNotification = () =>{
        setShowNotification(false);
    }
  return (
    <>
    <PageTitle>Welcome Customer</PageTitle>
    <SubTitle>View Wallet</SubTitle>
    <DetailsBox title="SETH Balance" value={cryptoBalance + " SETH"} copyEnabled={false}/>
    <DetailsBox title="Ticket Balance" value={`${ticketBalance} ticket(s)`} copyEnabled={false}/>
    {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
    </>
  );
}

export default  PurchaserViewWallet;