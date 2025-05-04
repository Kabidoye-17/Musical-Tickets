import React from 'react';
import styled from 'styled-components';

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

const CompanyName = styled.h1`
    font-size: 4rem;
    color: white;

`;


function NavBar() {
    return (
        <NavBarContainer>
            <NavBarRightContainer>
                <CompanyName>The Spot.</CompanyName>
            </NavBarRightContainer>
        </NavBarContainer>
      
    );
  }
  
export default NavBar;
  