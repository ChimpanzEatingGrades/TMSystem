"use client"

import { useEffect, useState } from "react"
import { Trash2, Plus, Minus, ArrowLeft, X, CheckCircle, Clock } from "lucide-react"
import Navbar from "../components/Navbar"
import { QRCodeCanvas } from "qrcode.react"
import { createCustomerOrder, transformCartToOrder, validateOrderData } from "../api/orders"

function CheckoutModal({ order, subtotal, onClose, onOrderSubmitted }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Transform cart data to order format
      const orderData = transformCartToOrder(order);

      // Validate transformed order data (matches API schema)
      const validation = validateOrderData(orderData);
      if (!validation.isValid) {
        setError("Please fill in all required fields");
        return;
      }
      
      // Submit order to backend
      const response = await createCustomerOrder(orderData);
      
      setSubmittedOrder(response.data);
      setOrderSubmitted(true);
      
      // Clear localStorage
      localStorage.removeItem("customer_order");
      
      // Notify parent component
      if (onOrderSubmitted) {
        onOrderSubmitted(response.data);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      // Prefer detailed backend validation/serializer errors if present
      const data = error.response?.data;
      if (data) {
        if (typeof data === 'string') {
          setError(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          // Flatten field errors into a readable string
          const messages = Object.entries(data)
            .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : String(msg)}`)
            .join(' | ');
          setError(messages || 'Failed to submit order. Please try again.');
        }
      } else {
        setError('Failed to submit order. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSubmitted && submittedOrder) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-black"
          >
            <X size={20} />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Order Submitted Successfully!
            </h2>
            
            <p className="text-gray-600 mb-4">
              Your order #{submittedOrder.id} has been received and is being processed.
            </p>

            {/* QR Code for the submitted order */}
            <div className="flex justify-center mb-4">
              <QRCodeCanvas
                value={JSON.stringify({
                  orderId: submittedOrder.id,
                  customerName: submittedOrder.customer_name,
                  total: submittedOrder.total_amount,
                  status: submittedOrder.status
                })}
                size={300}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Order #:</span>
                <span className="font-semibold">#{submittedOrder.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Customer:</span>
                <span className="font-semibold">{submittedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-lg">₱{submittedOrder.total_amount}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Please present this QR code to the cashier for payment.
            </p>

            <button
              onClick={onClose}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-center mb-4">
          Confirm Your Order
        </h2>

        {/* Order Summary */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{order.name || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{order.cart.length} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold">₱{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {order.requests && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-1">Special Requests:</h4>
              <p className="text-sm text-blue-800">{order.requests}</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Order'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ShoppingCartPage() {
  // Load order from localStorage
  const [order, setOrder] = useState(() => {
    const stored = localStorage.getItem("customer_order")
    return stored
      ? JSON.parse(stored)
      : {
          name: "",
          requests: "",
          cart: [],
        }
  })

  const { name, requests, cart } = order
  const [showModal, setShowModal] = useState(false)
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem("customer_order", JSON.stringify(order))
  }, [order])

  // Quantity adjustments
  const changeQuantity = (id, delta) => {
    setOrder((prev) => ({
      ...prev,
      cart: prev.cart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(1, item.quantity + delta),
                totalPrice: Math.max(1, item.quantity + delta) * item.unitPrice,
              }
            : item
        )
        .filter((item) => item.quantity > 0),
    }))
  }

  // Remove item
  const removeItem = (id) => {
    setOrder((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.id !== id),
    }))
  }

  // Update name
  const handleNameChange = (e) => {
    setOrder((prev) => ({
      ...prev,
      name: e.target.value,
    }))
  }

  // Update requests
  const handleRequestsChange = (e) => {
    setOrder((prev) => ({
      ...prev,
      requests: e.target.value,
    }))
  }

  // Subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-black">Your Cart</h1>
          <a
            href="/digital-menu"
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft size={18} />
            Back to Menu
          </a>
        </div>

        {orderSubmitted ? (
          <div className="bg-white p-8 rounded-xl border text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Submitted!</h2>
            <p className="text-gray-600 mb-4">Your order has been received and is being processed.</p>
            <button
              onClick={() => {
                setOrderSubmitted(false);
                setOrder({
                  name: "",
                  requests: "",
                  cart: [],
                });
              }}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg"
            >
              Place Another Order
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
            Your cart is empty.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-xl border flex items-center gap-4"
                >
                  {item.picture && (
                    <img
                      src={item.picture}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">{item.name}</h2>
                    <p className="text-gray-500 text-sm">{item.category}</p>
                    <div className="mt-1 text-yellow-600 font-bold">
                      ₱{item.unitPrice.toFixed(2)}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQuantity(item.id, -1)}
                      className="p-2 bg-gray-200 rounded-full"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-2">{item.quantity}</span>
                    <button
                      onClick={() => changeQuantity(item.id, 1)}
                      className="p-2 bg-gray-200 rounded-full"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Total price */}
                  <div className="w-24 text-right font-semibold">
                    ₱{item.totalPrice.toFixed(2)}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-4 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary + Customer Info */}
            <div className="bg-white p-6 rounded-xl border h-fit space-y-4">
              <h2 className="text-xl font-bold mb-2">Order Summary</h2>
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-black font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>

              {/* Customer Name */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                  placeholder="Enter your name"
                />
              </div>

              {/* Special Requests */}
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">
                  Special Requests
                </label>
                <textarea
                  value={requests}
                  onChange={handleRequestsChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400"
                  rows={3}
                  placeholder="E.g. No onions, allergic to eggs..."
                />
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => setShowModal(true)}
                className="w-full mt-6 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg shadow"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showModal && (
        <CheckoutModal
          order={order}
          subtotal={subtotal}
          onClose={() => setShowModal(false)}
          onOrderSubmitted={(submittedOrder) => {
            setOrderSubmitted(true);
            setShowModal(false);
          }}
        />
      )}
    </div>
  )
}
