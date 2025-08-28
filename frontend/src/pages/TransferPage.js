import React, { useState, useContext } from 'react';
import { openContractCall } from '@stacks/connect';
import { UserContext } from '../App';
import meditrackApi from '../api/meditrackApi';
import { uintCV, standardPrincipalCV, stringAsciiCV } from '@stacks/transactions'; // For Clarity value conversions

function TransferPage() {
  const { userData, contractInfo } = useContext(UserContext);
  const [id, setId] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
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

    if (!id || !newOwner || !recipientRole) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const functionArgs = [
        uintCV(parseInt(id)),
        standardPrincipalCV(newOwner),
        stringAsciiCV(recipientRole)
      ];

      await openContractCall({
        contractAddress: contractInfo.contractAddress,
        contractName: contractInfo.contractName,
        functionName: 'transfer-medicine',
        functionArgs,
        network: contractInfo.network,
        appDetails: {
          name: 'MediTrack dApp',
          icon: window.location.origin + '/logo.svg',
        },
        onFinish: async (data) => {
          console.log('Stacks transaction signed:', data.txId);
          setMessage('Transaction signed successfully by your wallet! Broadcasting...');
          try {
            const broadcastResult = await meditrackApi.broadcastSignedTransaction(data.txRaw);
            setMessage(`Medicine transfer initiated! Transaction ID: ${broadcastResult.txId}`);
            setId('');
            setNewOwner('');
            setRecipientRole('');
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
      <h2>Transfer Medicine Ownership</h2>
      <p className="note">
        Connect your Stacks wallet and sign the transaction to transfer ownership.
        <br/>
        <strong>Important:</strong> The connected wallet address MUST be the current owner of the medicine for the transaction to succeed on the blockchain.
      </p>
      <form onSubmit={handleSubmit} className="form-card">
        <label htmlFor="transferId">Medicine ID:</label>
        <input
          type="number"
          id="transferId"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="e.g., 101"
          required
        />

        <label htmlFor="newOwner">New Owner Address:</label>
        <input
          type="text"
          id="newOwner"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          placeholder="Stacks Address (e.g., SPXYZ...)"
          required
        />

        <label htmlFor="recipientRole">Recipient Role:</label>
        <select
          id="recipientRole"
          value={recipientRole}
          onChange={(e) => setRecipientRole(e.target.value)}
          required
        >
          <option value="">Select Role</option>
          <option value="distributor">Distributor</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="consumer">Consumer</option>
        </select>

        <button type="submit" disabled={loading || !userData}>
          {loading ? 'Waiting for Wallet...' : 'Transfer Medicine'}
        </button>
      </form>

      {!userData && <p className="error-message">Please connect your wallet to transfer medicine.</p>}
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">Error: {error}</p>}
    </div>
  );
}

export default TransferPage;