import { useState, useEffect } from 'react'
import { Bell, X, AlertTriangle, Clock, Package, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../api'

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all') // all, low_stock, expiring, expired
  const [expanded, setExpanded] = useState(null)
  const [autoChecking, setAutoChecking] = useState(false)

  useEffect(() => {
    fetchNotificationsWithAutoCheck()
    const interval = setInterval(fetchNotificationsWithAutoCheck, 60000)
    
    const handleImmediateRefresh = () => {
      console.log('NotificationPanel: "refreshInventory" event received. Fetching latest alerts...')
      // Immediately fetch without the 500ms delay
      fetchNotificationsWithAutoCheck()
    }
    
    window.addEventListener('refreshInventory', handleImmediateRefresh)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('refreshInventory', handleImmediateRefresh)
    }
  }, [])

  const fetchNotificationsWithAutoCheck = async () => {
    try {
      setAutoChecking(true)
      console.log('=== AUTO-CHECK STARTING ===')
      console.log('Timestamp:', new Date().toISOString())
      
      // Call auto_check_all to recalculate all alerts based on current inventory
      await api.post('/inventory/stock-alerts/auto_check_all/')
      
      console.log('=== AUTO-CHECK COMPLETE - FETCHING ALERTS ===')
      
      // Then fetch the refreshed alerts
      await fetchNotifications()
      
    } catch (error) {
      console.error('=== ERROR DURING AUTO-CHECK ===', error)
      await fetchNotifications()
    } finally {
      setAutoChecking(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      console.log('Fetching active alerts...')
      const response = await api.get('/inventory/stock-alerts/active/')
      console.log('Received', response.data.length, 'active alerts')
      setNotifications(response.data)
      setUnreadCount(response.data.filter(n => n.status === 'active').length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeNotification = async (alertId) => {
    try {
      await api.post(`/inventory/stock-alerts/${alertId}/acknowledge/`)
      fetchNotifications()
    } catch (error) {
      console.error('Error acknowledging notification:', error)
    }
  }

  const resolveNotification = async (alertId) => {
    try {
      await api.post(`/inventory/stock-alerts/${alertId}/resolve/`)
      fetchNotifications()
    } catch (error) {
      console.error('Error resolving notification:', error)
    }
  }

  // Clear all alerts (resolve non-resolved)
  const clearAllAlerts = async () => {
    try {
      setLoading(true)
      await api.post('/inventory/stock-alerts/clear_all/')
      await fetchNotifications()
    } catch (error) {
      console.error('Error clearing alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return <Package className="h-5 w-5" />
      case 'expired':
      case 'expiring_soon':
        return <Clock className="h-5 w-5" />
      case 'reorder':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'out_of_stock':
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'low_stock':
      case 'expiring_soon':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'reorder':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'low_stock') return ['low_stock', 'out_of_stock', 'reorder'].includes(n.alert_type)
    if (filter === 'expiring') return ['expiring_soon', 'expired'].includes(n.alert_type)
    return n.alert_type === filter
  })

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel - NOW ON LEFT */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel - Changed from right-0 to left-0 */}
          <div className="fixed left-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  Stock Alerts
                </h2>
                <p className="text-sm text-gray-800">
                  {unreadCount} active alert{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-yellow-600 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-900" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === 'all' 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('low_stock')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === 'low_stock' 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Low Stock ({notifications.filter(n => ['low_stock', 'out_of_stock', 'reorder'].includes(n.alert_type)).length})
                </button>
                <button
                  onClick={() => setFilter('expiring')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === 'expiring' 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Expiring ({notifications.filter(n => ['expiring_soon', 'expired'].includes(n.alert_type)).length})
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Bell className="h-12 w-12 mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        notification.status === 'active' ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getAlertColor(notification.alert_type)}`}>
                          {getAlertIcon(notification.alert_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {notification.raw_material_name}
                              </h3>
                              {notification.branch_name && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                  @ {notification.branch_name}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setExpanded(expanded === notification.id ? null : notification.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expanded === notification.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          
                          <p className={`text-xs font-medium mb-2 ${getAlertColor(notification.alert_type)} inline-block px-2 py-0.5 rounded`}>
                            {notification.alert_type_display}
                          </p>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          {expanded === notification.id && (
                            <div className="mt-2 pt-2 border-t space-y-1">
                              <p className="text-xs text-gray-500">
                                Current: {notification.current_quantity} {notification.raw_material_unit}
                              </p>
                              {notification.threshold_value && (
                                <p className="text-xs text-gray-500">
                                  Threshold: {notification.threshold_value} {notification.raw_material_unit}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                Created: {new Date(notification.created_at).toLocaleString()}
                              </p>
                              {notification.acknowledged_at && (
                                <p className="text-xs text-gray-500">
                                  Acknowledged: {new Date(notification.acknowledged_at).toLocaleString()}
                                  {notification.acknowledged_by_username && ` by ${notification.acknowledged_by_username}`}
                                </p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-2">
                            {notification.status === 'active' && (
                              <button
                                onClick={() => acknowledgeNotification(notification.id)}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md transition-colors"
                              >
                                Acknowledge
                              </button>
                            )}
                            <button
                              onClick={() => resolveNotification(notification.id)}
                              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md transition-colors"
                            >
                              Mark Resolved
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex gap-2">
                <button
                  onClick={fetchNotificationsWithAutoCheck}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh Alerts'}
                </button>
                <button
                  onClick={clearAllAlerts}
                  disabled={loading || autoChecking || notifications.length === 0}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Clear Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationPanel
