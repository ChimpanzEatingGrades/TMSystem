import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  X,
  Bell,
  Package
} from "lucide-react";
import { 
  getActiveAlerts, 
  getAlertCounts, 
  acknowledgeAlert, 
  resolveAlert 
} from "../../api/alerts";

const StockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
    fetchCounts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(() => {
      fetchAlerts();
      fetchCounts();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await getActiveAlerts();
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const response = await getAlertCounts();
      setCounts(response.data);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeAlert(id);
      fetchAlerts();
      fetchCounts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      fetchAlerts();
      fetchCounts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'expired':
      case 'out_of_stock':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'expiring_soon':
      case 'low_stock':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'reorder':
        return <Package className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'expired':
      case 'out_of_stock':
        return 'bg-red-50 border-red-200';
      case 'expiring_soon':
      case 'low_stock':
        return 'bg-yellow-50 border-yellow-200';
      case 'reorder':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.alert_type === filter);

  if (loading) {
    return <div className="text-center py-4">Loading alerts...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Stock Alerts</h2>
          {counts.active > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {counts.active}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'all' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All ({counts.active || 0})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'expired' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Expired ({counts.by_type?.expired || 0})
          </button>
          <button
            onClick={() => setFilter('low_stock')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'low_stock' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Low Stock ({counts.by_type?.low_stock || 0})
          </button>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
          <p>No active alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getAlertColor(alert.alert_type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {alert.alert_type_display}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                      <span>
                        {alert.raw_material_name} ({alert.current_quantity} {alert.raw_material_unit})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
                    title="Acknowledge"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                    title="Resolve"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
