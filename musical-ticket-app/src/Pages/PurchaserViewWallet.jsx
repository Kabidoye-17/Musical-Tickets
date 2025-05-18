import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import{ useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import web3Provider from '../Utils/web3Provider';
import { getBalanceOf } from '../Utils/common';
import { PageTitle, SubTitle} from './CreateWallet';

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

        if (web3Provider.isValidAddress(walletAddress)) {
            setIsLoading(true);
            
            // Fetch ETH balance
            const web3 = web3Provider.getWeb3();
            web3.eth.getBalance(walletAddress)
                .then(function(balance) {                    
                    const balanceInEther = web3Provider.fromWei(balance);
                    setCryptoBalance(balanceInEther);
                    
                    // Fetch ticket balance using our helper
                    return getBalanceOf(walletAddress);
                })
                .then(function(formattedBalance) {
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
    
    {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
    </>
  );
}

export default  PurchaserViewWallet;