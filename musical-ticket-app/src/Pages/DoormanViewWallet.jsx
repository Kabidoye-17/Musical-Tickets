import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import React, { useState } from 'react';
import styled from 'styled-components';
import Web3 from 'web3';
import { ActionButton, PageTitle, PasswordInput, SubTitle} from './CreateWallet';
import { Ticket } from "@phosphor-icons/react";
import { ABI, contractAddress, decimal, doormanAddress } from '../common.js';

function DoormanViewWallet() {
    const [walletAddress, setWalletAddress] = useState("");
    const [showNotification, setShowNotification] = useState(false);
    const [notification, setNotification] = useState({ success: false, message: "" });
    const [ticketBalance, setTicketBalance] = useState("-");
    const [isLoading, setIsLoading] = useState(false);


    const getTicketBalance = async (walletAddress) => {
        // Validate wallet address
        if (!walletAddress || !Web3.utils.isAddress(walletAddress)) {
            setNotification({ success: false, message: "Please enter a valid wallet address" });
            setShowNotification(true);
            return;
        }
        
        // Set loading state
        setIsLoading(true);
        
        const web3 = new Web3("https://sepolia.infura.io/v3/6f6f1ab124ff4449869f5df930ae6fd4");
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

    const closeNotification = () =>{
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
    >


    </PasswordInput>
    <ActionButton onClick={() => getTicketBalance(walletAddress)} disabled={isLoading}>
        {isLoading ? "Loading..." : "View Wallet"}
    </ActionButton>

    <DetailsBox title={"Ticket Balance"} icon={<Ticket size={32} />} copyEnabled={false} value={ticketBalance}/>
    {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
    
    </>
  );
}

export default DoormanViewWallet;