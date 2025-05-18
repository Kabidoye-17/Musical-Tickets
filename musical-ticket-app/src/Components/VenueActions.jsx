import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PasswordInput, ActionButton } from '../Pages/CreateWallet';
import WalletConnector from './WalletConnector';
import NotificationModal from './NotificationModal';
import { 
  WALLET_ROLES, 
  updateTicketPrice, 
  updateTicketPriceEthers, 
  withdrawFunds, 
  withdrawFundsEthers,
  depositFunds,
  depositFundsEthers,
  getTicketPrice,
  getWalletRole,
  contractAddress
} from '../Utils/common';
import web3Provider from '../Utils/web3Provider';

const Container = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: #333;
`;

const ActionSection = styled.div`
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;

  &:last-child {
    border-bottom: none;
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionInput = styled(PasswordInput)`
  flex: 1;
  width: auto;
`;

const InputLabel = styled.div`
  margin-bottom: 8px;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  color: #ff3b30;
  font-size: 0.9rem;
  margin-top: 5px;
  margin-bottom: 10px;
`;

const LoadingIndicator = styled.div`
  margin-top: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
`;

const BalanceIndicator = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MaxButton = styled.button`
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #e0e0e0;
  }
`;

function VenueActions() {
  // Wallet connection state
  const [wallet, setWallet] = useState(null);
  const [signer, setSigner] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  
  // Form state
  const [newTicketPrice, setNewTicketPrice] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  
  // Balance state
  const [venueBalance, setVenueBalance] = useState('0');
  const [contractBalance, setContractBalance] = useState('0');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ success: false, message: "" });
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState('');

  // Load current ticket price and balances when wallet is connected
  useEffect(() => {
    if (wallet) {
      fetchCurrentPrice();
      fetchBalances();
    }
  }, [wallet]);

  const fetchCurrentPrice = async () => {
    try {
      const price = await getTicketPrice();
      setCurrentPrice(price);
    } catch (error) {
      console.error("Error fetching ticket price:", error);
      setError("Failed to fetch current ticket price");
    }
  };

  const fetchBalances = async () => {
    if (!wallet) return;
    
    try {
      // Get venue wallet balance
      const web3 = web3Provider.getWeb3();
      const venueWeiBalance = await web3.eth.getBalance(wallet.address);
      const venueEthBalance = web3.utils.fromWei(venueWeiBalance, 'ether');
      setVenueBalance(parseFloat(venueEthBalance).toFixed(4));
      
      // Get contract balance
      const contractWeiBalance = await web3.eth.getBalance(contractAddress);
      const contractEthBalance = web3.utils.fromWei(contractWeiBalance, 'ether');
      setContractBalance(parseFloat(contractEthBalance).toFixed(4));
    } catch (error) {
      console.error("Error fetching balances:", error);
      setError("Failed to fetch balances");
    }
  };

  const handleWalletConnected = async (walletInfo, walletSigner, type) => {
    // Verify this is a venue wallet
    try {
      const role = await getWalletRole(walletInfo.address);
      
      if (role !== WALLET_ROLES.VENUE) {
        setNotification({
          success: false,
          message: "This wallet does not have venue permissions. Please connect a venue wallet."
        });
        setShowNotification(true);
        return;
      }
      
      setWallet(walletInfo);
      setSigner(walletSigner);
      setConnectionType(type);
      setNotification({
        success: true,
        message: "Venue wallet connected successfully!"
      });
      setShowNotification(true);
      setError('');
    } catch (error) {
      console.error("Error verifying wallet role:", error);
      setNotification({
        success: false,
        message: "Error verifying wallet role. Please try again."
      });
      setShowNotification(true);
    }
  };

  const handleUpdatePrice = async () => {
    if (!newTicketPrice || isNaN(parseFloat(newTicketPrice)) || parseFloat(newTicketPrice) <= 0) {
      setError("Please enter a valid ticket price");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      let result;
      if (connectionType === 'metamask') {
        result = await updateTicketPriceEthers(newTicketPrice, signer);
      } else {
        result = await updateTicketPrice(newTicketPrice, wallet);
      }
      
      setNotification({
        success: true,
        message: "Ticket price updated successfully!"
      });
      setShowNotification(true);
      setNewTicketPrice('');
      
      // Refresh the price display
      await fetchCurrentPrice();
    } catch (error) {
      console.error("Error updating ticket price:", error);
      setNotification({
        success: false,
        message: error.message || "Failed to update ticket price"
      });
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawFunds = async () => {
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0) {
      setError("Please enter a valid withdrawal amount");
      return;
    }
    
    if (parseFloat(withdrawAmount) > parseFloat(contractBalance)) {
      setError("Cannot withdraw more than the contract balance");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      let result;
      if (connectionType === 'metamask') {
        result = await withdrawFundsEthers(withdrawAmount, signer);
      } else {
        result = await withdrawFunds(withdrawAmount, wallet);
      }
      
      setNotification({
        success: true,
        message: `${withdrawAmount} ETH withdrawn successfully!`
      });
      setShowNotification(true);
      setWithdrawAmount('');
      
      // Refresh balances after withdrawal
      await fetchBalances();
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      setNotification({
        success: false,
        message: error.message || "Failed to withdraw funds. Make sure the contract has enough ETH."
      });
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepositFunds = async () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0) {
      setError("Please enter a valid deposit amount");
      return;
    }
    
    if (parseFloat(depositAmount) > parseFloat(venueBalance)) {
      setError("Cannot deposit more than your wallet balance");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      let result;
      if (connectionType === 'metamask') {
        result = await depositFundsEthers(depositAmount, signer);
      } else {
        result = await depositFunds(depositAmount, wallet);
      }
      
      setNotification({
        success: true,
        message: `${depositAmount} ETH deposited successfully!`
      });
      setShowNotification(true);
      setDepositAmount('');
      
      // Refresh balances after deposit
      await fetchBalances();
    } catch (error) {
      console.error("Error depositing funds:", error);
      setNotification({
        success: false,
        message: error.message || "Failed to deposit funds. Make sure your wallet has enough ETH."
      });
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxWithdraw = () => {
    setWithdrawAmount(contractBalance);
  };

  const setMaxDeposit = () => {
    // Set to slightly less than max to account for gas fees
    const maxDeposit = Math.max(0, parseFloat(venueBalance) - 0.01).toFixed(4);
    setDepositAmount(maxDeposit > 0 ? maxDeposit : '0');
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  return (
    <Container>
      <Title>Venue Contract Management</Title>
      
      {!wallet ? (
        <>
          <p>Connect your venue wallet to manage the contract:</p>
          <WalletConnector 
            onWalletConnected={handleWalletConnected}
            disallowedRoles={[WALLET_ROLES.DOORMAN, WALLET_ROLES.CUSTOMER]} 
            disallowedRolesMessage="manage the contract"
          />
        </>
      ) : (
        <>
          <ActionSection>
            <InputLabel>Current Ticket Price: {currentPrice} ETH</InputLabel>
            <InputGroup>
              <ActionInput
                type="text"
                placeholder="New Ticket Price (ETH)"
                value={newTicketPrice}
                onChange={(e) => setNewTicketPrice(e.target.value)}
              />
              <ActionButton onClick={handleUpdatePrice} disabled={isLoading}>
                Update Price
              </ActionButton>
            </InputGroup>
          </ActionSection>
          
          <ActionSection>
            <InputLabel>Withdraw Funds from Contract</InputLabel>
            <BalanceIndicator>
              <span>Available: {contractBalance} ETH</span>
              <MaxButton onClick={setMaxWithdraw}>Use Max</MaxButton>
            </BalanceIndicator>
            <InputGroup>
              <ActionInput
                type="text"
                placeholder="Amount to Withdraw (ETH)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <ActionButton onClick={handleWithdrawFunds} disabled={isLoading}>
                Withdraw
              </ActionButton>
            </InputGroup>
          </ActionSection>
          
          <ActionSection>
            <InputLabel>Deposit Funds to Contract</InputLabel>
            <BalanceIndicator>
              <span>Wallet Balance: {venueBalance} ETH</span>
              <MaxButton onClick={setMaxDeposit}>Use Max</MaxButton>
            </BalanceIndicator>
            <InputGroup>
              <ActionInput
                type="text"
                placeholder="Amount to Deposit (ETH)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <ActionButton onClick={handleDepositFunds} disabled={isLoading}>
                Deposit
              </ActionButton>
            </InputGroup>
          </ActionSection>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {isLoading && <LoadingIndicator>Processing transaction...</LoadingIndicator>}
        </>
      )}
      
      {showNotification && (
        <NotificationModal 
          message={notification} 
          closeModal={closeNotification}
        />
      )}
    </Container>
  );
}

export default VenueActions;
