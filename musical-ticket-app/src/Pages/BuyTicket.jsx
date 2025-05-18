import { useState } from 'react';
import styled from 'styled-components';

import NotificationModal from '../Components/NotificationModal';
import DetailsBox from '../Components/DetailsBox';
import WalletConnector from '../Components/WalletConnector';
import WarningBox from '../Components/WarningBox';
import { PageTitle, SubTitle, ActionButton } from './CreateWallet';

import { buyTicket, buyTicketEthers, getTicketPrice } from '../Utils/common';
import web3Provider from '../Utils/web3Provider';
import ethersProvider from '../Utils/ethersProvider';

export const TicketSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
`;

export const TicketInfo = styled.div`
  font-size: 1.5rem;
  color: #333;
  margin: 10px 0;
`;

export const QuantitySelector = styled.div`
  display: flex;
  gap: 15px;
  margin: 15px 0;
`;

export const QuantityButton = styled.button`
  padding: 10px 20px;
  background-color: ${props => props.active ? '#ff9c59' : '#fff'};
  color: ${props => props.active ? '#fff' : '#333'};
  border: 2px solid #ff9c59;
  border-radius: 5px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#ff7f40' : '#fff8f3'};
  }
`;

function BuyTicket() {
  // State variables
  const [walletInfo, setWalletInfo] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [notification, setNotification] = useState({ success: false, message: "" });
  const [showNotification, setShowNotification] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [connectionMethod, setConnectionMethod] = useState('keystore');
  
  // get the ticket price from the contract as it can change
  const ticketPrice = getTicketPrice();

  // Acts as a callback function to handle wallet connection
  // sets the method of connection (metamask or keystore)
  // and sets the wallet info and wallet object
  // Determines how to send the transaction based on the connection method
  const handleWalletConnected = (walletInfo, walletOrSigner, method) => {
    setWalletInfo(walletInfo);
    setWallet(walletOrSigner);
    setConnectionMethod(method);
  };

  const buyTickets = async () => {
    // You need a wallet to buy tickets
    if (!wallet) {
      setNotification({
        success: false,
        message: "Wallet not available. Please connect to your wallet first."
      });
      setShowNotification(true);
      return;
    }
    
    // Set the purchasing state to true to indicate transaction is in progress
    // prevents multiple transactions from being sent at once
    setIsPurchasing(true);

    try {
      // Calculate the total price in ETH
      const totalPrice = ticketPrice * ticketQuantity;
      
      // Buying a ticket using metamask
      if (connectionMethod === 'metamask') {
        const signer = await ethersProvider.getSigner();
        const receipt = await buyTicketEthers(ticketQuantity, signer, totalPrice);
        
        setNotification({
          success: true,
          message: `Successfully purchased ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.hash ? receipt.hash : "Check your wallet for the transaction."}`
        });
      } 
      
      // Buying a ticket using a keystore
      else {
        const account = web3Provider.createAccount(wallet.privateKey);
        const totalPriceWei = web3Provider.toWei(totalPrice);
        const receipt = await buyTicket(ticketQuantity, account, totalPriceWei);
        
        setNotification({
          success: true,
          message: `Successfully purchased ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.transactionHash}`
        });
      }
      
      setShowNotification(true);
    } 
    // Handle errors during the transaction
    catch (error) {
      setNotification({
        success: false,
        message: `Failed to purchase tickets: ${error.message}. Please check your wallet balance and try again.`
      });
      setShowNotification(true);
    } finally {
      // Reset the purchasing state when transaction completes (success or failure)
      setIsPurchasing(false);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
  };


  return (
    <>
      <PageTitle>Buy Ticket</PageTitle>
      <SubTitle>Connect your wallet to purchase tickets</SubTitle>
      
      {!walletInfo ? (
        <WalletConnector 
          onWalletConnected={handleWalletConnected} 
          disallowedRoles={['venue', 'doorman']}
          disallowedRolesMessage="purchase tickets"
        />
      ) : (
        <>
          <DetailsBox 
            title="Wallet Address" 
            value={walletInfo.address} 
            copyEnabled={true}
          />
          
          <TicketSection>
            <WarningBox>
              <strong>Friendly reminder:</strong> The actual transaction cost will be slightly higher than shown due to network gas fees. 
              Make sure your wallet has enough funds to cover both the ticket price and gas!
            </WarningBox>
            
            <TicketInfo>Ticket Price: {ticketPrice} ETH each</TicketInfo>
            
            <SubTitle>Select Quantity:</SubTitle>
            <QuantitySelector>
              <QuantityButton 
                active={ticketQuantity === 1} 
                onClick={() => setTicketQuantity(1)}
              >
                1 Ticket
              </QuantityButton>
              <QuantityButton 
                active={ticketQuantity === 2} 
                onClick={() => setTicketQuantity(2)}
              >
                2 Tickets
              </QuantityButton>
            </QuantitySelector>
            
            <TicketInfo>Total Cost: {ticketPrice * ticketQuantity} ETH</TicketInfo>
            
            <ActionButton 
              onClick={buyTickets}
              disabled={isPurchasing}
            >
              {isPurchasing ? "Processing..." : `Purchase ${ticketQuantity} Ticket${ticketQuantity > 1 ? 's' : ''}`}
            </ActionButton>
          </TicketSection>
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

export default BuyTicket;
