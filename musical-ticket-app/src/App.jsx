import React from 'react';
import CreateWallet from "./Pages/CreateWallet";
//import ViewWallet from "./Pages/ViewWallet";
import WhoAmI from './Pages/WhoAmI';
import NavBar from './Components/NavBar';

import styled from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import { Route, Routes, Navigate } from 'react-router-dom';
import VenueViewWallet from './Pages/VenueViewWallet';
import DoormanViewWallet from './Pages/DoormanViewWallet';
import PurchaserViewWallet from './Pages/PurchaserViewWallet';
const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  min-height: fit-content;
  height: 100vh;
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
      <BrowserRouter>
        <MainContainer>
          <Top>
            <NavBar />
          </Top>
          <Routes>
            <Route path="/create-wallet" element={<CreateWallet />} />
            <Route path="/view-wallet-auth" element={<WhoAmI />} />
            <Route path="/view-wallet-venue" element={<VenueViewWallet />} />
            <Route path="/view-wallet-doorman" element={<DoormanViewWallet />} />
            <Route path="/view-wallet-customer" element={<PurchaserViewWallet />} />
            {/* Default redirect to View Wallet */}
            <Route path="/" element={<Navigate to="/view-wallet-auth" replace />} />
          </Routes>
        </MainContainer>
      </BrowserRouter>
    );
  }

export default App;
