import React from 'react';

function HomePage() {
  return (
    <div className="container">
      <h2>Welcome to MediTrack!</h2>
      <p>Your decentralized platform for tracking medicine provenance on the Stacks blockchain.</p>
      <p>Use the navigation above to:</p>
      <ul>
        <li><strong>Verify Medicine:</strong> Check the current status and history of a medicine.</li>
        <li><strong>Register Medicine:</strong> As a manufacturer, add new medicines to the system.</li>
        <li><strong>Transfer Medicine:</strong> As an owner, transfer medicine to another entity (e.g., distributor, pharmacy).</li>
      </ul>
      <p>Explore the features and see how blockchain brings transparency to supply chains!</p>
    </div>
  );
}

export default HomePage;