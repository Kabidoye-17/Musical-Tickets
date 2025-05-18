import { useState, useEffect } from 'react';
import styled from 'styled-components';
import NotificationModal from '../Components/NotificationModal';
import DetailsBox from '../Components/DetailsBox';
import WalletConnector from '../Components/WalletConnector';
import WarningBox from '../Components/WarningBox';
import { PageTitle, SubTitle, ActionButton } from './CreateWallet';
import {getTicketPrice, getBalanceOf, getRefund, getRefundEthers } from '../Utils/common';
import web3Provider from '../Utils/web3Provider';
import ethersProvider from '../Utils/ethersProvider';
import { Ticket } from "@phosphor-icons/react";
import { TicketInfo, TicketSection, QuantitySelector, QuantityButton} from './BuyTicket';


const QuantityInput = styled.input`
  width: 80px;
  padding: 10px;
  text-align: center;
  font-size: 1.2rem;
  border: 2px solid #ff9c59;
  border-radius: 5px;
  &:focus {
    outline: none;
    border-color: #ff7f40;
  }
`;


const RefundButton = styled(ActionButton)`
  background-color: #dc3545;
  
  &:hover {
    background-color: #c82333;
  }
`;

function Refund() {
  const [walletInfo, setWalletInfo] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [notification, setNotification] = useState({ success: false, message: "" });
  const [showNotification, setShowNotification] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [connectionMethod, setConnectionMethod] = useState('keystore');
  const [ticketBalance, setTicketBalance] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(0.01); // Default value, will update from contract
 
  // Get ticket price from contract when component loads
  useEffect(() => {
    const getTicketPriceFromContract = async () => {
      try {
        const priceEth = await getTicketPrice();
        setTicketPrice(parseFloat(priceEth));
      } catch (error) {
        console.error("Error fetching ticket price:", error);
      }
    };
    
    getTicketPriceFromContract();
  }, []);

  // Handle wallet connection from WalletConnector
  const handleWalletConnected = (walletInfo, walletOrSigner, method, balance) => {
    setWalletInfo(walletInfo);
    setWallet(walletOrSigner);
    setConnectionMethod(method);
    
    if (balance !== null) {
      setTicketBalance(balance);
      
      // If no tickets, show a notification
      if (parseFloat(balance) === 0) {
        setNotification({
          success: false,
          message: "You don't have any tickets to refund."
        });
        setShowNotification(true);
      }
    }
  };

  // Process the refund
  const processRefund = async () => {
    if (!wallet) {
      setNotification({
        success: false,
        message: "Wallet not available. Please connect to your wallet first."
      });
      setShowNotification(true);
      return;
    }

    // Check if user has enough tickets
    if (ticketBalance < ticketQuantity) {
      setNotification({
        success: false,
        message: `You don't have enough tickets. Your balance: ${ticketBalance} tickets.`
      });
      setShowNotification(true);
      return;
    }

    setIsRefunding(true);

    try {
      if (connectionMethod === 'metamask') {
        // Use our ethersProvider singleton to get a signer
        const signer = await ethersProvider.getSigner();
        const receipt = await getRefundEthers(ticketQuantity, signer);
        
        // Update ticket balance after refund
        const newBalance = await getBalanceOf(walletInfo.address);
        setTicketBalance(newBalance);
        
        setNotification({
          success: true,
          message: `Successfully refunded ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.hash ? receipt.hash : "Check your wallet for the transaction."}`
        });
      } else {
        // Use the web3Provider helper to create an account properly
        const account = web3Provider.createAccount(wallet.privateKey);
        
        // Use our helper function
        const receipt = await getRefund(ticketQuantity, account);
        
        // Update ticket balance after refund
        const newBalance = await getBalanceOf(wallet.address);
        setTicketBalance(newBalance);
        
        setNotification({
          success: true,
          message: `Successfully refunded ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.transactionHash}`
        });
      }
      
      setShowNotification(true);
    } catch (error) {
      let errorMessage = error.message;
      
      // Better error handling for specific contract errors
      if (errorMessage.includes("Not enough balance to give a refund")) {
        errorMessage = "The venue appears to have withdrawn funds from the contract. Unfortunately, there's not enough ETH in the contract to process your refund. Please contact the venue directly to resolve this issue.";
      }
      
      setNotification({
        success: false,
        message: `Failed to process refund: ${errorMessage}`
      });
      setShowNotification(true);
    } finally {
      setIsRefunding(false);
    }
  };

  // Modify the ticket quantity handling
  const incrementQuantity = () => {
    if (ticketQuantity < ticketBalance) {
      setTicketQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (ticketQuantity > 1) {
      setTicketQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    
    // Ensure input is a valid number
    if (isNaN(value)) {
      return;
    }
    
    // Enforce min/max limits
    if (value >= 1 && value <= ticketBalance) {
      setTicketQuantity(value);
    } else if (value < 1) {
      setTicketQuantity(1);
    } else if (value > ticketBalance) {
      setTicketQuantity(ticketBalance);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  return (
    <>
      <PageTitle>Refund Tickets</PageTitle>
      <SubTitle>Get a refund for your tickets</SubTitle>
      
      {!walletInfo ? (
        <WalletConnector 
          onWalletConnected={handleWalletConnected} 
          disallowedRoles={['venue', 'doorman']}
          disallowedRolesMessage="request refunds"
          getBalanceAfterConnect={true}
          getBalanceOf={getBalanceOf}
        />
      ) : (
        <>
          <DetailsBox 
            title="Wallet Address" 
            value={walletInfo.address} 
            copyEnabled={true}
          />
          
          <DetailsBox 
            title="Ticket Balance" 
            icon={<Ticket size={32} />}
            value={`${ticketBalance} ticket(s)`}
            copyEnabled={false}
          />
          
          {ticketBalance > 0 ? (
            <TicketSection>
              <WarningBox>
                <strong>Important:</strong> Refunding tickets will return {ticketPrice} ETH per ticket to your wallet.
                This transaction requires gas fees. The refund process cannot be undone.
              </WarningBox>
              
              <SubTitle>Select Quantity to Refund:</SubTitle>
              <QuantitySelector>
                <QuantityButton 
                  onClick={decrementQuantity}
                  disabled={ticketQuantity <= 1}
                >
                  -
                </QuantityButton>
                
                <QuantityInput
                  type="number"
                  min="1"
                  max={ticketBalance}
                  value={ticketQuantity}
                  onChange={handleQuantityChange}
                />
                
                <QuantityButton 
                  onClick={incrementQuantity}
                  disabled={ticketQuantity >= ticketBalance}
                >
                  +
                </QuantityButton>
              </QuantitySelector>
              
              <TicketInfo>Refund Amount: {ticketPrice * ticketQuantity} ETH</TicketInfo>
              <TicketInfo>Available Tickets: {ticketBalance}</TicketInfo>
              
              <RefundButton 
                onClick={processRefund}
                disabled={isRefunding || ticketQuantity > ticketBalance}
              >
                {isRefunding ? "Processing..." : `Refund ${ticketQuantity} Ticket${ticketQuantity > 1 ? 's' : ''}`}
              </RefundButton>
            </TicketSection>
          ) : (
            <WarningBox icon="ℹ️">
              You don't have any tickets to refund. Please purchase tickets first.
            </WarningBox>
          )}
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

export default Refund;
