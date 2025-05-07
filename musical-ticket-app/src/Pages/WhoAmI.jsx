import React from 'react';
import styled from 'styled-components';
import { PageTitle } from './CreateWallet';
import { ActionButton, PasswordInput } from './CreateWallet';
import Web3 from 'web3';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import NotificationModal from '../Components/NotificationModal';



function WhoAmI() {

    console.log("Environment variables:", {
        venueHash: process.env.REACT_APP_VENUE_HASH,
        doormanHash: process.env.REACT_APP_DOORMAN_HASH
    });
    
    const [walletAddress, setWalletAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState("");
    const [showNotification, setShowNotification] = useState(false);

    const nav = useNavigate();

    const authorizedHashes = {
        [process.env.REACT_APP_VENUE_HASH]: "venue",
        [process.env.REACT_APP_DOORMAN_HASH]: "doorman",
    }

    const hashWalletAddress = (address) => {
        return CryptoJS.SHA256(address.trim().toLowerCase()).toString();
    };

    const closeNotification = () => {
        setShowNotification(false);
    }

    const redirectToViewWallet = (walletAddress) => {
        setIsLoading(true);

        try{
            const hashedAddress = hashWalletAddress(walletAddress);
            const role = authorizedHashes[hashedAddress];

            if (role) {
                nav(`/view-wallet-${role}`);
            } else {
                nav('/view-wallet-customer', { 
                    state: { walletAddress: walletAddress }
                });
            }

        } catch (error) {
            setNotification({ 
                success: false, 
                message: "Error fetching balances: " + error.message 
            });
            setShowNotification(true);
        }
        finally {
            setIsLoading(false);
        }
    }

    
    return(
            <>
        <PageTitle>Who Am I?</PageTitle>
         <PasswordInput 
                id="walletAddress"
                onChange={(e) => setWalletAddress(e.target.value)} 
                placeholder="Enter your wallet address" 
            />
            <ActionButton 
                onClick={() => redirectToViewWallet(walletAddress)}
                disabled={false}
            >
                {isLoading ? "Loading..." : "Enter"}
            </ActionButton>
            {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
            </>
    )
}

export default WhoAmI;