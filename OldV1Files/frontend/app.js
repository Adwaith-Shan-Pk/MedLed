// src/components/Manufacturer.js (React)

import React, { useState } from 'react';
import { useConnect } from '@stacks/connect-react';
import { StacksMocknet } from '@stacks/network';
import { standardPrincipalCV, uintCV } from '@stacks/transactions';

const Manufacturer = () => {
  const { doContractCall } = useConnect();
  const [medId, setMedId] = useState('');

  const addMedicine = async () => {
    await doContractCall({
      network: new StacksMocknet(),
      contractAddress: 'ST1PQHQKV0RJQDSE6B18D37D024B705W2B2E63B4', // Replace with your contract address
      contractName: 'medicine-tracker',
      functionName: 'add-medicine',
      functionArgs: [
        standardPrincipalCV('ST1PQHQKV0RJQDSE6B18D37D024B705W2B2E63B4'),
        uintCV(parseInt(medId))
      ],
      postConditionMode: 1, // 1 for Allow
      onFinish: (data) => {
        console.log('Transaction finished:', data);
      }
    });
  };

  return (
    <div>
      <h2>Manufacturer Dashboard</h2>
      <input
        type="text"
        placeholder="Medicine ID"
        value={medId}
        onChange={(e) => setMedId(e.target.value)}
      />
      <button onClick={addMedicine}>Add Medicine</button>
    </div>
  );
};

export default Manufacturer;