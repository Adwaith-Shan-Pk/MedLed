// frontend/src/api.js
import { StacksTestnet } from '@stacks/network';
import {
  contractPrincipalCV,
  uintCV,
  stringAsciiCV,
  callReadOnlyFunction,
  makeContractSTXPostRequest,
} from '@stacks/transactions';

const CONTRACT_NAME = 'medicine-tracker';
const CONTRACT_ADDRESS = 'ST3J2GVV1B4Z37X7KX1X5X1QZ522GW0Q43Z156XW2'; // Replace with your deployed address

const network = new StacksTestnet();

export async function connectWallet() {
  if (window.StacksProvider) {
    await window.StacksProvider.request('connect');
  }
}

async function sendTransaction(contractFn, args) {
  const txOptions = {
    contractName: CONTRACT_NAME,
    contractAddress: CONTRACT_ADDRESS,
    functionName: contractFn,
    functionArgs: args,
    network,
    appDetails: {
      name: 'Medicine Tracker',
      icon: window.location.origin + '/logo192.png',
    },
    onFinish: (data) => {
      console.log('Transaction submitted:', data);
    },
  };
  await makeContractSTXPostRequest(txOptions);
}

export function addPrescription(doctor, patientId, signature) {
  sendTransaction('add-prescription', [contractPrincipalCV(doctor), uintCV(patientId), stringAsciiCV(signature)]);
}

export function verifyPrescription(prescriptionId) {
  callReadOnlyFunction({
    contractName: CONTRACT_NAME,
    contractAddress: CONTRACT_ADDRESS,
    functionName: 'verify-prescription',
    functionArgs: [uintCV(prescriptionId)],
    network,
  }).then((result) => {
    console.log('Verification result:', result);
  });
}

export function registerMedicine(name) {
  sendTransaction('register-medicine', [stringAsciiCV(name)]);
}

export function updateMedicineLocation(medicineId, location) {
  sendTransaction('update-medicine-location', [uintCV(medicineId), stringAsciiCV(location)]);
}