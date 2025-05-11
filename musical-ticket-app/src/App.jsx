import React from 'react';
import CreateWallet from "./Pages/CreateWallet";
import WhoAmI from './Pages/WhoAmI';
import NavBar from './Components/NavBar';
import Watch from './Pages/Watch';
import ProtectedRoute from './Components/ProtectedRoute';

import styled from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import { Route, Routes, Navigate } from 'react-router-dom';
import VenueViewWallet from './Pages/VenueViewWallet';
import DoormanViewWallet from './Pages/DoormanViewWallet';
import PurchaserViewWallet from './Pages/PurchaserViewWallet';
import BuyTicket from './Pages/BuyTicket';

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
          
          {/* Protected Routes - Only accessible after going through WhoAmI */}
          <Route path="/view-wallet-venue" element={
            <ProtectedRoute>
              <VenueViewWallet />
            </ProtectedRoute>
          } />
          
          <Route path="/view-wallet-doorman" element={
            <ProtectedRoute>
              <DoormanViewWallet />
            </ProtectedRoute>
          } />
          
          <Route path="/view-wallet-customer" element={
            <ProtectedRoute>
              <PurchaserViewWallet />
            </ProtectedRoute>
          } />
          
          <Route path='/buy-ticket' element={<BuyTicket/>} />
          <Route path='/watch' element={<Watch/>}/>
          
          {/* Default redirect to View Wallet */}
          <Route path="/" element={<Navigate to="/view-wallet-auth" replace />} />
        </Routes>
      </MainContainer>
    </BrowserRouter>
  );
}

export default App;
