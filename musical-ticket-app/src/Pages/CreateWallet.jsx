import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import{ useState } from 'react';
import styled from 'styled-components';
import web3Provider from '../Utils/web3Provider';


export const PageTitle = styled.h1`
    font-size: 4rem;    
    color: #ff9c59;
    margin: 0;
`;

export const SubTitle = styled.h2`
    font-size: 3rem;    
    color:rgb(94, 62, 40);
    margin: 0;
`;

export const PasswordInput = styled.input`
    width: 30%;
    height: 30px;
    border-radius: 5px;
    border: 1px solid #ccc;
    padding: 5px;
    font-size: 1rem;
    margin: 5px;
    outline: none;
    &:focus {
        border-color: #ff9c59;
        box-shadow: 0 0 5px #ff9c59;
    }
`;

export const ActionButton = styled.button`  
    height: 50px;
    border-radius: 5px;
    border: 1px solid #ccc;
    padding: 5px;
    font-size: 2rem;
    margin: 5px;
    outline: none;
    background-color: #ff9c59;
    color: white;
    cursor: pointer;
    &:hover {
        background-color: #ff7f40;
    }
`;

function CreateWallet() {
    const [walletAddress, setWalletAddress] = useState("-");
    const [privateKey, setPrivateKey] = useState("-");
    const [keyStoreFile, setKeyStoreFile] = useState({});
    const [password, setPassword] = useState(""); 
    const [showNotification, setShowNotification] = useState(false);
    const [notification, setNotification] = useState({ success: false, message: "" });

    const handleCreateWallet = async () => {
        // Validate password meets minimum requirements
        if (password.trim().length < 3) {
            setNotification({ 
                success: false, 
                message: "Your password must be at least 3 characters long" 
            });
            setShowNotification(true);
            return;
        }
    
        try {
            // Create a new Ethereum wallet using web3
            const web3 = web3Provider.getWeb3();
            const wallet = web3.eth.accounts.create();
            // Encrypt the private key with the user's password to create a keystore file
            const keystore = await web3.eth.accounts.encrypt(wallet.privateKey, password);
    
            // Update state with the new wallet details
            setWalletAddress(wallet.address);
            setPrivateKey(wallet.privateKey);
            setKeyStoreFile(keystore);
            setNotification({ 
                success: true, 
                message: "Your wallet has been successfully created" 
            });
            setShowNotification(true);
        } catch (error) {
            // Handle any errors during wallet creation
            setNotification({ 
                success: false, 
                message: "Uh oh there was an issue: " + error.message 
            });
            setShowNotification(true);
        }
    };
    
    const downloadKeystore = () => {
        // Verify keystore exists before attempting download
        if (!keyStoreFile || Object.keys(keyStoreFile).length === 0) {
            setNotification({ 
                success: false, 
                message: "No keystore file to download" 
            });
            setShowNotification(true);
            return;
        };
    
        // Format the keystore as a properly indented JSON string
        const json = JSON.stringify(keyStoreFile, null, 2);
        // Create a downloadable blob from the JSON
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
    
        // Create and trigger a temporary download link
        const link = document.createElement('a');
        link.href = url;
        link.download = 'keystore.json'; 
        document.body.appendChild(link);
        link.click();
        // Clean up by removing the link and revoking the URL
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

      const closeNotification = () =>{
        setShowNotification(false);
    }
    return (
        <>
            <PageTitle>Create Wallet</PageTitle>
            <PasswordInput 
                type="password" 
                placeholder="Enter your password (min 3 chars)" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <ActionButton onClick={handleCreateWallet}>Create Wallet</ActionButton>
            <DetailsBox title={"Wallet Address"} copyEnabled={true} value={walletAddress}/>
            <DetailsBox title={"Private Key"}  copyEnabled={true} value={privateKey}/>
            <DetailsBox title={"KeyStore File"}  copyEnabled={true} value={JSON.stringify(keyStoreFile)}/> 
            <ActionButton onClick={downloadKeystore}>Download Keystore File</ActionButton>
            {showNotification && <NotificationModal message={notification} closeModal={closeNotification}/>}
        </>
    );
}

export default CreateWallet;