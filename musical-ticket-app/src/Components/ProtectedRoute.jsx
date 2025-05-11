import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  
  // Check if we have the wallet address in the state
  // This would have been set by the WhoAmI component
  const walletAddress = location.state?.walletAddress;

  // If no wallet address exists in state, redirect to the WhoAmI page
  if (!walletAddress) {
    return <Navigate to="/view-wallet-auth" replace />;
  }

  // If everything is okay, render the protected component
  return children;
}

export default ProtectedRoute;
