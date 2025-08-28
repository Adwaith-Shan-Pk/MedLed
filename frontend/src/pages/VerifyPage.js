import React, { useState } from 'react';
import meditrackApi from '../api/meditrackApi';
import MedicineDetails from '../components/MedicineDetails';
// Removed unused imports: callReadOnlyFunction, cvToJSON, uintCV, StacksTestnet

function VerifyPage() { // No longer needs contractInfo prop directly if using backend API
  const [medicineId, setMedicineId] = useState('');
  const [medicineData, setMedicineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMedicineData(null);
    setLoading(true);

    if (!medicineId) {
      setError('Please enter a medicine ID.');
      setLoading(false);
      return;
    }

    try {
      // Still calling the backend's /verify endpoint
      const data = await meditrackApi.verifyMedicine(parseInt(medicineId));
      setMedicineData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Verify Medicine</h2>
      <form onSubmit={handleSubmit} className="form-card">
        <label htmlFor="medicineId">Medicine ID:</label>
        <input
          type="number"
          id="medicineId"
          value={medicineId}
          onChange={(e) => setMedicineId(e.target.value)}
          placeholder="e.g., 123"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {error && <p className="error-message">Error: {error}</p>}

      {medicineData && <MedicineDetails data={medicineData} />}
    </div>
  );
}

export default VerifyPage;