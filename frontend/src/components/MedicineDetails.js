import React from 'react';
import './MedicineDetails.css'; // We'll create this file

function MedicineDetails({ data }) {
  if (!data) {
    return <p>No medicine data to display.</p>;
  }

  return (
    <div className="medicine-details-card">
      <h3>Medicine Details</h3>
      <p><strong>ID:</strong> {data.id.value}</p>
      <p><strong>Batch Number:</strong> {data['batch-number'].value}</p>
      <p><strong>Current Owner:</strong> {data['current-owner'].value}</p>
      <p><strong>Owner Role:</strong> {data['owner-role'].value}</p>
      <p><strong>Status:</strong> {data.status.value === 'registered' ? 'Registered' : data.status.value}</p>
      {data.history && data.history.length > 0 && (
        <div className="history-section">
          <h4>Transfer History:</h4>
          <ul>
            {data.history.map((entry, index) => (
              <li key={index}>
                Transfer to {entry['new-owner'].value} ({entry['recipient-role'].value}) on {entry.timestamp.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MedicineDetails;