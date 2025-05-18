import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import { useState } from 'react';
import web3Provider from '../Utils/web3Provider';
import { ActionButton, PageTitle, PasswordInput} from './CreateWallet';

function ViewWallet() {
    const [walletAddress, setWalletAddress] = useState("");
    const [notification, setNotification] = useState("");
    const [showNotification, setShowNotification] = useState(false);
    const [ticketBalance, setTicketBalance] = useState("-");
    const [cryptoBalance, setCryptoBalance] = useState("-");
    const [isLoading, setIsLoading] = useState(false);

    const displayWalletDetails = (walletAddress) => {
        if (web3Provider.isValidAddress(walletAddress)){
            setIsLoading(true);
            
            // Fetch ETH balance using the new helper method
            web3Provider.getBalance(walletAddress)
                .then(function(balanceInEther) {                    
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
    }

    const closeNotification = () =>{
        setShowNotification(false);
    }
  return (
    <>
    <PageTitle>Welcome Customer</PageTitle>
    <PageTitle>View Wallet</PageTitle>
    <PasswordInput 
        id="walletAddress"
        onChange={(e) => setWalletAddress(e.target.value)} 
        placeholder="Enter your wallet address" 
    />
    <ActionButton 
        onClick={() => displayWalletDetails(walletAddress)}
        disabled={isLoading}
    >
        {isLoading ? "Loading..." : "Enter"}
    </ActionButton>
    <DetailsBox title="SETH Balance" value={cryptoBalance + " SETH"} copyEnabled={false}/>
    <DetailsBox title="Ticket Balance" value={`${ticketBalance} ticket(s)`} copyEnabled={false}/>
    {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
    </>
  );
}

export default ViewWallet;