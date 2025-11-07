import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import api from "../../api";

const AdminVoidModal = ({ order, onClose, onConfirm }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirmVoid = async () => {
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      
      // Call the new backend endpoint to verify credentials
      await api.post("/inventory/verify-admin/", { username, password });
      // If the above call succeeds (doesn't throw an error), it means authorization was successful.
      // Now, proceed with the actual cancellation.
      await onConfirm();
      onClose(); // Close the modal on success
      

    } catch (err) {
      const errorMessage = err.response?.data?.error || "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={28} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Authorization Required</h2>
              <p className="text-sm text-gray-600">Voiding order #{order.id} requires manager approval.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter manager's username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter manager's password"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleConfirmVoid} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Verifying..." : "Confirm Void"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AdminVoidModal;