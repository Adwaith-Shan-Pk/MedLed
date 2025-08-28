import React, { useState, useContext } from 'react';
import { openContractCall } from '@stacks/connect';
import { UserContext } from '../App';
import meditrackApi from '../api/meditrackApi';
import { uintCV, stringAsciiCV } from '@stacks/transactions'; // For Clarity value conversions

function RegisterPage() {
  const { userData, contractInfo } = useContext(UserContext);
  const [id, setId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    if (!userData?.profile?.stxAddress?.testnet) {
      setError('Please connect your wallet first!');
      setLoading(false);
      return;
    }

    if (!id || !batchNumber) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const functionArgs = [uintCV(parseInt(id)), stringAsciiCV(batchNumber)];

      await openContractCall({
        contractAddress: contractInfo.contractAddress,
        contractName: contractInfo.contractName,
        functionName: 'register-medicine',
        functionArgs,
        network: contractInfo.network,
        appDetails: {
          name: 'MediTrack dApp',
          icon: window.location.origin + '/logo.svg',
        },
        onFinish: async (data) => {
          console.log('Stacks transaction signed:', data.txId);
          setMessage('Transaction signed successfully by your wallet! Broadcasting...');
          // Now send the raw transaction to your backend for broadcasting
          try {
            const broadcastResult = await meditrackApi.broadcastSignedTransaction(data.txRaw);
            setMessage(`Medicine registered! Transaction ID: ${broadcastResult.txId}`);
            setId('');
            setBatchNumber('');
          } catch (broadcastError) {
            console.error('Error broadcasting signed transaction:', broadcastError);
            setError(`Failed to broadcast transaction: ${broadcastError.error || broadcastError.message}`);
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          setError('Transaction signing cancelled by user.');
          setLoading(false);
        },
      });

    } catch (err) {
      console.error('Error preparing contract call:', err);
      setError(`Failed to prepare transaction: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Register New Medicine</h2>
      <p className="note">
        This action requires you to connect your Stacks wallet and sign the transaction.
      </p>
      <form onSubmit={handleSubmit} className="form-card">
        <label htmlFor="id">Medicine ID:</label>
        <input
          type="number"
          id="id"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Unique ID (e.g., 101)"
          required
        />

        <label htmlFor="batchNumber">Batch Number:</label>
        <input
          type="text"
          id="batchNumber"
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value)}
          placeholder="e.g., ABC-XYZ-2023"
          required
        />

        <button type="submit" disabled={loading || !userData}>
          {loading ? 'Waiting for Wallet...' : 'Register Medicine'}
        </button>
      </form>

      {!userData && <p className="error-message">Please connect your wallet to register medicine.</p>}
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">Error: {error}</p>}
    </div>
  );
}

export default RegisterPage;