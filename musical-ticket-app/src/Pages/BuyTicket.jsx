import{ useState } from 'react';
import styled from 'styled-components';
import NotificationModal from '../Components/NotificationModal';
import DetailsBox from '../Components/DetailsBox';
import WalletConnector from '../Components/WalletConnector';
import WarningBox from '../Components/WarningBox';
import { PageTitle, SubTitle, ActionButton} from './CreateWallet';
import {buyTicket, buyTicketEthers } from '../Utils/common';
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

function BuyTicket()  {
  const [walletInfo, setWalletInfo] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [notification, setNotification] = useState({ success: false, message: "" });
  const [showNotification, setShowNotification] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [connectionMethod, setConnectionMethod] = useState('keystore');
  
  // Ticket price from contract (0.01 ETH)
  const ticketPrice = 0.01;

  // Handle wallet connection from WalletConnector
  const handleWalletConnected = (walletInfo, walletOrSigner, method) => {
    setWalletInfo(walletInfo);
    setWallet(walletOrSigner);
    setConnectionMethod(method);
  };

  const buyTickets = async () => {
    if (!wallet) {
      setNotification({
        success: false,
        message: "Wallet not available. Please connect to your wallet first."
      });
      setShowNotification(true);
      return;
    }

    setIsPurchasing(true);

    try {
      if (connectionMethod === 'metamask') {
        // Use our ethersProvider singleton to get a signer
        const signer = await ethersProvider.getSigner();
        const receipt = await buyTicketEthers(ticketQuantity, signer, ticketPrice * ticketQuantity);
        
        setNotification({
          success: true,
          message: `Successfully purchased ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.hash ? receipt.hash : "Check your wallet for the transaction."}`
        });
      } else {
        // Use the web3Provider helper to create an account properly
        const account = web3Provider.createAccount(wallet.privateKey);
        
        // Calculate the total price in wei
        const totalPriceWei = web3Provider.toWei(ticketPrice * ticketQuantity);
        
        // Use our helper function
        const receipt = await buyTicket(ticketQuantity, account, totalPriceWei);
        
        setNotification({
          success: true,
          message: `Successfully purchased ${ticketQuantity} ticket(s)! Transaction hash: ${receipt.transactionHash}`
        });
      }
      
      setShowNotification(true);
    } catch (error) {
      setNotification({
        success: false,
        message: `Failed to purchase tickets: ${error.message}. Please check your wallet balance and try again.`
      });
      setShowNotification(true);
    } finally {
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
