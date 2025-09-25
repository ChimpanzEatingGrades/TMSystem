"use client"

import { useEffect, useState } from "react"
import { Trash2, Plus, Minus, ArrowLeft, X } from "lucide-react"
import Navbar from "../components/Navbar"
import { QRCodeCanvas } from "qrcode.react"

function CheckoutModal({ order, subtotal, onClose }) {
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
          Present to Cashier
        </h2>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <QRCodeCanvas
            value={JSON.stringify(order)}
            size={400}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Total */}
        <div className="text-center text-lg font-semibold">
          Total: ₱{subtotal.toFixed(2)}
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

        {cart.length === 0 ? (
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
        />
      )}
    </div>
  )
}
