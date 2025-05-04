import React from 'react';
import CreateWallet from "./Pages/CreateWallet";
import NavBar from './Components/NavBar';

import styled from 'styled-components';
const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  height: 100%;
  width: 100%;
  gap: 20px;
  background-color: #FCECDD;
  padding-bottom: 60px;
  `;
  const Top = styled.div`
  display: flex;  
  width: 100%;  
  `;
function App() {
  return (
    <MainContainer>
    <Top>
    <NavBar />
    </Top>
    <CreateWallet />
    </MainContainer>
      
  );
}

export default App;
