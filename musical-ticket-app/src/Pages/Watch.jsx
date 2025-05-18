import React, { useState, useRef } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import styled from 'styled-components';
import NotificationModal from '../Components/NotificationModal';
import DetailsBox from '../Components/DetailsBox';
import WalletConnector from '../Components/WalletConnector';
import { PageTitle, SubTitle, ActionButton } from './CreateWallet';
import { ABI, contractAddress, getBalanceOf, returnTicket, returnTicketEthers } from '../Utils/common';
import web3Provider from '../Utils/web3Provider';
import ethersProvider from '../Utils/ethersProvider';
import { TicketInfo, TicketSection } from './BuyTicket';

const VideoWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 30px auto;
  padding: 20px;
  background: linear-gradient(145deg, #f5f7fa, #e4e6eb);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  }
`;

const VideoTitle = styled.h3`
  text-align: center;
  margin: 0 0 15px 0;
  font-size: 1.5rem;
  color: #333;
  font-weight: 500;
`;

const VideoContainer = styled.div`
  width: 100%;
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 3px solid #ff9c59;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #ff9c59, #ff7f40, #ffab76);
    z-index: -1;
    border-radius: 12px;
    pointer-events: none;
  }
`;

const VideoPlayer = styled.video`
  width: 100%;
  display: block;
  transition: opacity 0.5s ease-in-out;
  background-color: #000;
  
  &:focus {
    outline: none;
  }
  
  /* Custom styling for controls when supported */
  &::-webkit-media-controls-panel {
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
  }
  
  &::-webkit-media-controls-play-button {
    background-color: #ff9c59;
    border-radius: 50%;
  }
  
  &::-webkit-media-controls-volume-slider {
    background-color: #ff9c59;
    border-radius: 25px;
    padding-left: 8px;
    padding-right: 8px;
  }
  
  &::-webkit-media-controls-timeline {
    background-color: rgba(255, 156, 89, 0.5);
    border-radius: 25px;
    margin-left: 10px;
    margin-right: 10px;
  }
`;

const VideoDescription = styled.p`
  margin-top: 15px;
  color: #555;
  text-align: center;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 0 10px;
`;

function Watch() {
  const [walletInfo, setWalletInfo] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState({ success: false, message: "" });
  const [showNotification, setShowNotification] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState('keystore');
  const [ticketBalance, setTicketBalance] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  
  const videoRef = useRef(null);
  
  // Handle wallet connection from WalletConnector
  const handleWalletConnected = (walletInfo, walletOrSigner, method, balance) => {
    setWalletInfo(walletInfo);
    setWallet(walletOrSigner);
    setConnectionMethod(method);
    
    if (balance !== null) {
      setTicketBalance(balance);
    }
  };

  const watchFilm = async () => {
    if (ticketBalance < 1) {
      setNotification({
        success: false,
        message: "You need at least one ticket to watch the film."
      });
      setShowNotification(true);
      return;
    }

    setIsProcessing(true);

    try {
      if (connectionMethod === 'metamask') {
        // Use our ethersProvider singleton to get a signer
        const signer = await ethersProvider.getSigner();
        await returnTicketEthers(1, signer);
      } else {
        // Use the web3Provider helper to create an account properly
        const account = web3Provider.createAccount(wallet.privateKey);
        
        // Use our helper function to return the ticket
        await returnTicket(1, account);
      }
      
      // Update ticket balance
      const newBalance = ticketBalance - 1;
      setTicketBalance(newBalance);
      
      // Show the video
      setShowVideo(true);
      
      setNotification({
        success: true,
        message: "Ticket returned successfully. Enjoy the film!"
      });
      setShowNotification(true);
      
      // Play the video after a short delay
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, 1000);
      
    } catch (error) {
      setNotification({
        success: false,
        message: `Failed to process ticket: ${error.message}`
      });
      setShowNotification(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  return (
    <>
      <PageTitle>Watch Film</PageTitle>
      <SubTitle>Connect your wallet to watch the film</SubTitle>
      
      {!walletInfo ? (
        <WalletConnector 
          onWalletConnected={handleWalletConnected} 
          disallowedRoles={['venue', 'doorman']}
          disallowedRolesMessage="watch the film"
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
          
          <TicketSection>
            <TicketInfo>Your Tickets: {ticketBalance}</TicketInfo>
            
            {showVideo ? (
              <VideoWrapper>
                <VideoTitle>Wait For Me - Musical Film</VideoTitle>
                <VideoContainer>
                  <VideoPlayer 
                    ref={videoRef}
                    controls
                    controlsList="nodownload"
                    autoPlay
                  >
                    <source src="/waitForMe.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </VideoPlayer>
                </VideoContainer>
                <VideoDescription>
                  Enjoy your exclusive access to our musical film. This video is available for a limited time with your ticket.
                </VideoDescription>
              </VideoWrapper>
            ) : (
              <ActionButton 
                onClick={watchFilm}
                disabled={isProcessing || ticketBalance < 1}
              >
                {isProcessing ? "Processing..." : "Watch Film (Uses 1 Ticket)"}
              </ActionButton>
            )}
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

export default Watch;