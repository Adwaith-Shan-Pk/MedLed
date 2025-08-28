import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../App'; // Import the context
import './Navbar.css';

function Navbar() {
  const { userData, authenticate, disconnect } = useContext(UserContext);
  const userAddress = userData?.profile?.stxAddress?.testnet; // Adjust for mainnet if needed

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">MediTrack</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/verify">Verify Medicine</Link></li>
        <li><Link to="/register">Register Medicine</Link></li>
        <li><Link to="/transfer">Transfer Medicine</Link></li>
        <li className="wallet-status">
          {userAddress ? (
            <>
              <span>Connected: {userAddress.substring(0, 4)}...{userAddress.substring(userAddress.length - 4)}</span>
              <button onClick={disconnect} className="wallet-button disconnect">Disconnect</button>
            </>
          ) : (
            <button onClick={authenticate} className="wallet-button connect">Connect Wallet</button>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;