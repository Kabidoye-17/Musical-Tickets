import { PageTitle } from './CreateWallet';
import { ActionButton, PasswordInput } from './CreateWallet';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationModal from '../Components/NotificationModal';
import { getWalletRole } from '../Utils/common';

function WhoAmI() {

    const [walletAddress, setWalletAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState("");
    const [showNotification, setShowNotification] = useState(false);

    const nav = useNavigate();

    const closeNotification = () => {
        setShowNotification(false);
    }

    const redirectToViewWallet = async (walletAddress) => {
        setIsLoading(true);

        try {
            // Use the common utility to get the wallet role - now with await
            const role = await getWalletRole(walletAddress);

            if (role && role !== 'customer') {
                nav(`/view-wallet-${role}`, { state: { walletAddress: walletAddress }});
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