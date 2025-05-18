import { useState } from 'react';
import { ethers} from 'ethers';
import styled from 'styled-components';
import NotificationModal from './NotificationModal';
import { PasswordInput, ActionButton } from '../Pages/CreateWallet';
import { getWalletRole } from '../Utils/common';
import ethersProvider from '../Utils/ethersProvider';

const FileInput = styled(PasswordInput)`
  padding: 10px;
`;

const ConnectionToggle = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
  width: 100%;
  max-width: 400px;
`;

const ToggleOption = styled.button`
  flex: 1;
  padding: 12px;
  background-color: ${props => props.active ? '#ff9c59' : '#fff'};
  color: ${props => props.active ? '#fff' : '#333'};
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 500;

  &:hover {
    background-color: ${props => props.active ? '#ff7f40' : '#fff8f3'};
  }
`;

function WalletConnector({ 
  onWalletConnected, 
  disallowedRoles = [], 
  disallowedRolesMessage = "access this functionality",
  getBalanceAfterConnect = false,
  getBalanceOf = null
}) {
  const [password, setPassword] = useState('');
  const [keystoreFile, setKeystoreFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ success: false, message: "" });
  const [showNotification, setShowNotification] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState('keystore');
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setKeystoreFile(e.target.files[0]);
    }
  };

  // Connect with MetaMask
  const connectMetaMask = async () => {
    setIsLoading(true);
    
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install it to continue.");
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      // Check if the wallet is a special role using our common utility - IMPORTANT: add await here
      const role = await getWalletRole(address);
      
      if (role && disallowedRoles.includes(role)) {
        setNotification({
          success: false,
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} wallets cannot ${disallowedRolesMessage}. Disconnect this wallet and try again.`
        });
        setShowNotification(true);
        setIsLoading(false);
        return;
      }
      
      // Use window.ethereum directly to create a provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create wallet info object
      const walletInfo = {
        address: address,
        privateKey: null
      };
      
      let balance = null;
      
      // Get balance if required
      if (getBalanceAfterConnect && getBalanceOf) {
        try {
          balance = await getBalanceOf(address);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
      
      // Pass the connected wallet back to parent
      onWalletConnected(walletInfo, signer, 'metamask', balance);
      
      setNotification({ 
        success: true, 
        message: "Connected to MetaMask successfully!" 
      });
      setShowNotification(true);
    } catch (err) {
      setNotification({ 
        success: false, 
        message: err.message || "Failed to connect to MetaMask" 
      });
      setShowNotification(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Decrypt keystore wallet
  const decryptWallet = async () => {
    if (!keystoreFile) {
      setNotification({ 
        success: false, 
        message: "Please select a keystore file" 
      });
      setShowNotification(true);
      return;
    }

    if (!password) {
      setNotification({ 
        success: false, 
        message: "Please enter your wallet password" 
      });
      setShowNotification(true);
      return;
    }

    setIsLoading(true);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        try {
          const decryptedWallet = await ethers.Wallet.fromEncryptedJson(event.target.result, password);
          
          // Check if the wallet is a special role - IMPORTANT: add await here
          const role = await getWalletRole(decryptedWallet.address);
          
          if (role && disallowedRoles.includes(role)) {
            setNotification({
              success: false,
              message: `${role.charAt(0).toUpperCase() + role.slice(1)} wallets cannot ${disallowedRolesMessage}.`
            });
            setShowNotification(true);
            setIsLoading(false);
            return;
          }
          
          // Create wallet info object
          const walletInfo = {
            address: decryptedWallet.address,
            privateKey: decryptedWallet.privateKey
          };
          
          let balance = null;
          
          // Get balance if required
          if (getBalanceAfterConnect && getBalanceOf) {
            try {
              balance = await getBalanceOf(decryptedWallet.address);
            } catch (error) {
              console.error("Error fetching balance:", error);
            }
          }
          
          // Pass the connected wallet back to parent
          onWalletConnected(walletInfo, decryptedWallet, 'keystore', balance);
          
          setNotification({ 
            success: true, 
            message: "Wallet decrypted successfully!" 
          });
          setShowNotification(true);
        } catch (err) {
          setNotification({ 
            success: false, 
            message: "Failed to decrypt wallet. Please check your password and file." 
          });
          setShowNotification(true);
        } finally {
          setIsLoading(false);
        }
      };

      fileReader.onerror = () => {
        setNotification({ 
          success: false, 
          message: "Failed to read the file" 
        });
        setShowNotification(true);
        setIsLoading(false);
      };

      fileReader.readAsText(keystoreFile);
    } catch (err) {
      setNotification({ 
        success: false, 
        message: err.message || "An error occurred" 
      });
      setShowNotification(true);
      setIsLoading(false);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  return (
    <>
      <ConnectionToggle>
        <ToggleOption 
          active={connectionMethod === 'keystore'} 
          onClick={() => setConnectionMethod('keystore')}
        >
          Keystore File
        </ToggleOption>
        <ToggleOption 
          active={connectionMethod === 'metamask'} 
          onClick={() => setConnectionMethod('metamask')}
        >
          MetaMask
        </ToggleOption>
      </ConnectionToggle>
      
      {connectionMethod === 'keystore' ? (
        <>
          <FileInput 
            type="file" 
            onChange={handleFileChange} 
          />
          
          <PasswordInput 
            type="password" 
            placeholder="Enter your wallet password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
          />
          
          <ActionButton 
            onClick={decryptWallet}
            disabled={isLoading}
          >
            {isLoading ? "Decrypting..." : "Decrypt Wallet"}
          </ActionButton>
        </>
      ) : (
        <ActionButton 
          onClick={connectMetaMask}
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect to MetaMask"}
        </ActionButton>
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

export default WalletConnector;
