require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  broadcastTransaction, // We'll keep this for broadcasting received signed transactions
  callReadOnlyFunction,
  uintCV,
  stringAsciiCV,
  // standardPrincipalCV, // No longer needed for backend signing
  cvToJSON
} = require('@stacks/transactions');
const { StacksTestnet } = require('@stacks/network');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuration ---
const network = new StacksTestnet();
// const privateKey = process.env.MANUFACTURER_PRIVATE_KEY; // <-- REMOVE THIS, signing is on frontend
const contractAddress = process.env.CONTRACT_ADDRESS;
const contractName = process.env.CONTRACT_NAME;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Endpoints ---

/**
 * @api {get} /verify/:id Verify a medicine's details
 * @description A public endpoint to check the status of a medicine.
 * (No change needed here, as it's a read-only function)
 */
app.get('/verify/:id', async (req, res) => {
  try {
    const medicineId = parseInt(req.params.id);
    if (isNaN(medicineId)) {
      return res.status(400).json({ error: 'Invalid medicine ID.' });
    }

    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'verify-medicine',
      functionArgs: [uintCV(medicineId)],
      senderAddress: contractAddress, // Can be any valid address for read-only calls
      network,
    });

    const jsonData = cvToJSON(result);
    if (jsonData.value === null) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }

    res.json(jsonData.value.value);

  } catch (error) {
    console.error('Error verifying medicine:', error);
    res.status(500).json({ error: 'Failed to verify medicine.' });
  }
});

/**
 * @api {post} /broadcast-tx Broadcast a signed transaction
 * @description A generic endpoint to broadcast a transaction signed by the client.
 * The client (frontend) sends the raw signed transaction hex.
 */
app.post('/broadcast-tx', async (req, res) => {
  try {
    const { signedTx } = req.body; // Expect the raw signed transaction hex
    if (!signedTx) {
      return res.status(400).json({ error: 'Signed transaction (signedTx) is required.' });
    }

    // Convert hex string back to a buffer/Uint8Array if necessary for broadcastTransaction
    // broadcastTransaction expects a Uint8Array or Buffer
    const transaction = Buffer.from(signedTx, 'hex');

    const broadcastResponse = await broadcastTransaction(transaction, network);

    // Check for Stacks API errors
    if (broadcastResponse.error) {
        console.error('Stacks Broadcast Error:', broadcastResponse.error);
        return res.status(500).json({ error: broadcastResponse.error, reason: broadcastResponse.reason });
    }

    res.json({
      message: 'Transaction broadcasted successfully!',
      txId: broadcastResponse.txid,
      // You might want to return the raw response from broadcastTransaction for more details
      // rawResponse: broadcastResponse
    });

  } catch (error) {
    console.error('Error broadcasting transaction:', error);
    // Differentiate between known Stacks API errors and generic network/server errors
    res.status(500).json({ error: 'Failed to broadcast transaction.', details: error.message });
  }
});

// REMOVE the old /register and /transfer endpoints.
// Their functionality is now handled by the frontend constructing the transaction
// and sending it to /broadcast-tx.
// The actual Clarity function call logic is now only on the frontend.


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`MediTrack server running on http://localhost:${PORT}`);
  console.log('------------------------------------');
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Contract Name:    ${contractName}`);
  console.log('------------------------------------');
});