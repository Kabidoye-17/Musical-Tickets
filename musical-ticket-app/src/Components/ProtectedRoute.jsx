import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const location = useLocation();

  const walletAddress = location.state?.walletAddress;

  if (!walletAddress) {
    return <Navigate to="/view-wallet-auth" replace />;
  }

  return children;
}

export default ProtectedRoute;
