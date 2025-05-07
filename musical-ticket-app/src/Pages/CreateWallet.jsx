import DetailsBox from '../Components/DetailsBox';
import NotificationModal from '../Components/NotificationModal';
import React, { useState } from 'react';
import styled from 'styled-components';
import Web3 from 'web3';


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
        if (password.trim().length < 3) {
            setNotification({ 
                success: false, 
                message: "Your password must be at least 3 characters long" 
            });
            setShowNotification(true);
            return;
        }
    
        try {
            const web3 = new Web3();
            const wallet = web3.eth.accounts.create();
            const keystore = await web3.eth.accounts.encrypt(wallet.privateKey, password);
    
            setWalletAddress(wallet.address);
            setPrivateKey(wallet.privateKey);
            setKeyStoreFile(keystore);
            setNotification({ 
                success: true, 
                message: "Your wallet has been successfully created" 
            });
            setShowNotification(true);
        } catch (error) {
            setNotification({ 
                success: false, 
                message: "Uh oh there was an issue: " + error.message 
            });
            setShowNotification(true);
        }
    };
    
    const closeNotification = () =>{
        setShowNotification(false);
    }
    
    const downloadKeystore = () => {
        if (!keyStoreFile || Object.keys(keyStoreFile).length === 0) {
            setNotification({ 
                success: false, 
                message: "No keystore file to download" 
            });
            setShowNotification(true);
            return;
        };
    
        const json = JSON.stringify(keyStoreFile, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
    
        const link = document.createElement('a');
        link.href = url;
        link.download = 'keystore.json'; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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