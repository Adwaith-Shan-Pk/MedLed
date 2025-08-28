import axios from 'axios';

const BASE_URL = 'http://localhost:3001'; // Your backend server address

const meditrackApi = {
  verifyMedicine: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/verify/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying medicine:', error);
      throw error.response?.data || error.message;
    }
  },

  broadcastSignedTransaction: async (signedTx) => {
    try {
      const response = await axios.post(`${BASE_URL}/broadcast-tx`, { signedTx });
      return response.data;
    } catch (error) {
      console.error('Error broadcasting signed transaction:', error);
      throw error.response?.data || error.message;
    }
  }
};

export default meditrackApi;