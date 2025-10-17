import { forwardRef } from 'react'

const OrderReceipt = forwardRef(({ order }, ref) => {
  if (!order) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div ref={ref} className="bg-white p-8 max-w-md mx-auto">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-container, .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: 80mm auto;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="receipt-container font-mono text-sm">
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
          <h1 className="text-2xl font-bold mb-1">RECEIPT</h1>
          {order.branch_name && (
            <p className="text-lg font-semibold">{order.branch_name}</p>
          )}
          <p className="text-xs text-gray-600 mt-2">
            Order #{order.id}
          </p>
        </div>

        {/* Order Info */}
        <div className="mb-4 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-semibold">{formatDate(order.order_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span className="font-semibold">{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span>{order.customer_phone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="uppercase font-semibold">{order.status}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-t-2 border-dashed border-gray-400 pt-4 mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2">Item</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2">
                    <div className="font-medium">{item.menu_item_name}</div>
                    {item.special_instructions && (
                      <div className="text-[10px] text-gray-600 italic">
                        Note: {item.special_instructions}
                      </div>
                    )}
                  </td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">₱{parseFloat(item.unit_price).toFixed(2)}</td>
                  <td className="text-right py-2 font-semibold">₱{parseFloat(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Special Requests */}
        {order.special_requests && (
          <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
            <p className="font-semibold text-gray-700 mb-1">Special Requests:</p>
            <p className="text-gray-600 italic">{order.special_requests}</p>
          </div>
        )}

        {/* Totals */}
        <div className="border-t-2 border-dashed border-gray-400 pt-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">₱{parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          {order.tax_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="font-semibold">₱{parseFloat(order.tax_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t-2 border-gray-400 pt-2">
            <span>TOTAL:</span>
            <span>₱{parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-dashed border-gray-400 pt-4 text-center space-y-2">
          <p className="text-xs text-gray-600">Thank you for your order!</p>
          <p className="text-xs text-gray-600">Please come again</p>
          {order.processed_by_name && (
            <p className="text-[10px] text-gray-500 mt-3">
              Served by: {order.processed_by_name}
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-[10px] text-gray-400">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})

OrderReceipt.displayName = 'OrderReceipt'

export default OrderReceipt
