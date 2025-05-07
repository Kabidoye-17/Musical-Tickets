import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const NavBarContainer = styled.div`
    display: flex;
    background-color: #ff9c59;
    height: 100px;
    width: 100%;
    box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
    `;

const NavBarRightContainer = styled.div`
    width: 20%;	
    height: inherit;
    background-color: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
`;
const NavBarLeftContainer = styled.div`
    width: 80%;	
    height: inherit;
    background-color: transparent;
    display: flex;
    justify-content: end;
    align-items: center;
    font-size: 2rem;
`;

const CompanyName = styled.h1`
    font-size: 4rem;
    color: white;

`;

const NavButton = styled.button`
    background-color: transparent;
    border: none;
    color: white;
    font-size: 2rem;
    cursor: pointer;
    margin: 0 20px;
    padding: 10px 20px;
    border-radius: 5px;
    transition: background-color 0.3s ease;
`;



function NavBar() {
    const navigate = useNavigate();
    
    const handleCreateWallet = () => {
        navigate('/create-wallet');
    };

    const handleViewWallet = () => {
        navigate('/view-wallet-auth');
    }
    
    return (
        <NavBarContainer>
            <NavBarRightContainer>
                <CompanyName>The Spot.</CompanyName>
            </NavBarRightContainer>
            <NavBarLeftContainer>
                <NavButton onClick={() => handleViewWallet()}>View Wallet</NavButton>
                <NavButton onClick={() => handleCreateWallet()}>Create Wallet</NavButton>
            </NavBarLeftContainer>
        </NavBarContainer>
      
    );
  }
  
export default NavBar;
