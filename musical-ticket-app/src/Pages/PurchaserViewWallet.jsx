import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Web3 from 'web3';
import { ABI, contractAddress, decimal, sepoliaRPC } from '../common';
import { ActionButton, PageTitle, PasswordInput, SubTitle} from './CreateWallet';

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

        const web3 = new Web3(sepoliaRPC);

        if (web3.utils.isAddress(walletAddress)) {
            setIsLoading(true);
            
            // Create contract instance
            const contract = new web3.eth.Contract(ABI, contractAddress);
            
            // Fetch ETH balance
            web3.eth.getBalance(walletAddress)
                .then(function(balance) {                    
                    const balanceInEther = web3.utils.fromWei(balance, "ether");
                    setCryptoBalance(balanceInEther);
                    
                    // Fetch ticket balance
                    return contract.methods.balanceOf(walletAddress).call();
                })
                .then(function(ticketBal) {
                    // Use web3.utils.fromWei instead of BigInt
                    const formattedBalance = web3.utils.fromWei(ticketBal.toString(), 'ether');
                    setTicketBalance(formattedBalance);
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

    const closeNotification = () => {
        setShowNotification(false);
    }
  return (
    <>
    <PageTitle>Welcome Customer</PageTitle>
    <SubTitle>View Wallet</SubTitle>
    <DetailsBox title="SETH Balance" value={cryptoBalance + " SETH"} copyEnabled={false}/>
    <DetailsBox title="Ticket Balance" value={`${ticketBalance} ticket(s)`} copyEnabled={false}/>
    
    <WarningBox>
      <WarningIcon>⚠️</WarningIcon>
      <div>
        <strong>Friendly reminder:</strong> When making transactions, the total cost will include the ticket price plus gas fees, 
        which may vary depending on network conditions. Always make sure you have enough SETH to cover both!
      </div>
    </WarningBox>
    
    {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
    </>
  );
}

export default  PurchaserViewWallet;