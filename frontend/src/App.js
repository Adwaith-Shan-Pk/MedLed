import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppConfig, UserSession, showConnect, callReadOnlyFunction } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import { cvToJSON, uintCV, stringAsciiCV, standardPrincipalCV } from '@stacks/transactions'; // Add for frontend logic

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import VerifyPage from './pages/VerifyPage';
import RegisterPage from './pages/RegisterPage';
import TransferPage from './pages/TransferPage';

import './App.css';

// Wallet configuration
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

// Create a context for the user session
export const UserContext = createContext(null);

function App() {
  const [userData, setUserData] = useState(null);
  //const [network] = useState(new StacksTestnet()); // Stacks Network instance for direct calls
  const [network] = useState(STACKS_TESTNET); // Use the constant directly
  const [contractAddress] = useState(process.env.REACT_APP_CONTRACT_ADDRESS || ''); // Fallback
  const [contractName] = useState(process.env.REACT_APP_CONTRACT_NAME || 'meditrack-v2'); // Fallback

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData);
      });
    } else if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  const authenticate = () => {
    showConnect({
      appDetails: {
        name: 'MediTrack dApp',
        icon: window.location.origin + '/logo.svg', // Ensure you have a logo.svg in public
      },
      onFinish: (data) => {
        setUserData(data.userSession.loadUserData());
      },
      userSession,
    });
  };

  const disconnect = () => {
    userSession.signUserOut();
    setUserData(null);
  };

  const userValue = {
    userSession,
    userData,
    authenticate,
    disconnect,
    contractInfo: { contractAddress, contractName, network }
  };

  return (
    <Router>
      <UserContext.Provider value={userValue}>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Verify page can still use the backend API or direct chain call */}
            <Route path="/verify" element={<VerifyPage contractInfo={userValue.contractInfo} />} />
            {/* Register and Transfer pages now require wallet authentication */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/transfer" element={<TransferPage />} />
          </Routes>
        </main>
      </UserContext.Provider>
    </Router>
  );
}

export default App;