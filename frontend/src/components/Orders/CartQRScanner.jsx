import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

const CartQRScanner = ({ isOpen, onClose, onOrderScanned }) => {
  const [scanMode, setScanMode] = useState('upload') // Start with upload as default
  const [error, setError] = useState('')
  const [scannedData, setScannedData] = useState(null)
  const [cameraPermission, setCameraPermission] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const html5QrcodeRef = useRef(null)
  const isScanning = useRef(false)

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      getCameras()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen, scanMode])

  useEffect(() => {
    if (selectedCamera && scanMode === 'camera') {
      startCamera()
    }
  }, [selectedCamera])

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      console.log('Available cameras:', devices)
      
      if (devices && devices.length > 0) {
        setCameras(devices)
        
        // Filter out virtual cameras (OBS, ManyCam, etc.)
        const physicalCameras = devices.filter(device => {
          const label = device.label.toLowerCase()
          return !label.includes('obs') && 
                 !label.includes('virtual') && 
                 !label.includes('manycam') &&
                 !label.includes('snap')
        })
        
        // Priority order for camera selection:
        // 1. Built-in laptop camera (usually contains "integrated" or "built-in")
        // 2. Back/rear camera on mobile
        // 3. First physical camera
        // 4. Any camera as fallback
        
        let selectedCam = null
        
        // Try to find built-in/integrated camera
        selectedCam = physicalCameras.find(device => {
          const label = device.label.toLowerCase()
          return label.includes('integrated') || 
                 label.includes('built-in') ||
                 label.includes('laptop') ||
                 label.includes('hd webcam')
        })
        
        // If not found, try back camera (mobile)
        if (!selectedCam) {
          selectedCam = physicalCameras.find(device => {
            const label = device.label.toLowerCase()
            return label.includes('back') || label.includes('rear')
          })
        }
        
        // If still not found, use first physical camera
        if (!selectedCam && physicalCameras.length > 0) {
          selectedCam = physicalCameras[0]
        }
        
        // Fallback to any camera
        if (!selectedCam) {
          selectedCam = devices[0]
        }
        
        setSelectedCamera(selectedCam.id)
        setCameraPermission('granted')
        
        console.log('Selected camera:', selectedCam.label)
      } else {
        setError('No cameras found on this device')
        setCameraPermission('denied')
      }
    } catch (err) {
      console.error('Error getting cameras:', err)
      setError('Camera access denied. Please allow camera permissions in your browser.')
      setCameraPermission('denied')
    }
  }

  const startCamera = async () => {
    if (isScanning.current || !selectedCamera) return

    try {
      // Stop any existing instance
      await stopCamera()

      // Create new instance
      html5QrcodeRef.current = new Html5Qrcode('camera-qr-reader')
      
      // Start scanning
      await html5QrcodeRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        onScanError
      )
      
      isScanning.current = true
      setError('')
      console.log('Camera started successfully')
    } catch (err) {
      console.error('Error starting camera:', err)
      setError('Failed to start camera: ' + err.message)
      isScanning.current = false
    }
  }

  const stopCamera = async () => {
    if (html5QrcodeRef.current && isScanning.current) {
      try {
        await html5QrcodeRef.current.stop()
        html5QrcodeRef.current.clear()
        html5QrcodeRef.current = null
        isScanning.current = false
        console.log('Camera stopped')
      } catch (err) {
        console.error('Error stopping camera:', err)
      }
    }
  }

  const parseAndValidateQR = (decodedText) => {
    try {
      console.log('Parsing QR data:', decodedText)
      
      if (decodedText.startsWith('CART:')) {
        const parts = decodedText.substring(5).split('|')
        if (parts.length >= 3) {
          const customerName = parts[0]
          const subtotal = parseFloat(parts[1])
          const itemsStr = parts[2]
          const requests = parts[3] || ''
          
          const items = itemsStr.split(',').map(itemStr => {
            const [menuItemId, qty] = itemStr.split(':')
            return {
              menu_item: parseInt(menuItemId),
              quantity: parseInt(qty),
              special_instructions: ''
            }
          })
          
          return {
            valid: true,
            data: {
              type: 'CART_ORDER',
              customer_name: customerName,
              special_requests: requests,
              items: items,
              subtotal: subtotal,
              tax_amount: 0
            }
          }
        }
      }
      
      const orderData = JSON.parse(decodedText)
      
      if (orderData.type === 'CART_ORDER') {
        return { valid: true, data: orderData }
      }
      
      if (orderData.name && orderData.cart && Array.isArray(orderData.cart)) {
        return {
          valid: true,
          data: {
            type: 'CART_ORDER',
            customer_name: orderData.name,
            special_requests: orderData.requests || '',
            items: orderData.cart.map(item => ({
              menu_item: item.id,
              quantity: item.quantity,
              special_instructions: item.special_instructions || ''
            })),
            subtotal: orderData.total || orderData.cart.reduce((sum, item) => sum + item.totalPrice, 0),
            tax_amount: 0
          }
        }
      }
      
      return { valid: false, error: 'Invalid cart QR code format' }
    } catch (err) {
      console.error('QR Parse Error:', err)
      return { valid: false, error: 'Failed to parse QR code: ' + err.message }
    }
  }

  const onScanSuccess = async (decodedText) => {
    console.log('Cart QR Code scanned:', decodedText)
    await stopCamera()
    
    const result = parseAndValidateQR(decodedText)
    
    if (result.valid) {
      setScannedData(result.data)
      setError('')
    } else {
      setError(result.error)
    }
  }

  const onScanError = (err) => {
    // Silently ignore scanning errors (they're normal during scanning)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setError('')
    
    try {
      const html5QrCode = new Html5Qrcode('upload-qr-reader')
      const decodedText = await html5QrCode.scanFile(file, false)
      console.log('Cart QR Code from image:', decodedText)
      
      const result = parseAndValidateQR(decodedText)
      
      if (result.valid) {
        setScannedData(result.data)
        setError('')
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Scan error:', err)
      const errorMsg = err.message || 'Failed to read QR code from image'
      setError(errorMsg.includes('No MultiFormat') 
        ? 'Could not read QR code. Please ensure the image is clear and well-lit.'
        : errorMsg
      )
    }
  }

  const handleCreateOrder = () => {
    if (scannedData && onOrderScanned) {
      onOrderScanned(scannedData)
      handleClose()
    }
  }

  const handleRescan = () => {
    setScannedData(null)
    setError('')
    if (scanMode === 'camera' && selectedCamera) {
      startCamera()
    }
  }

  const handleClose = async () => {
    await stopCamera()
    setScannedData(null)
    setError('')
    setCameraPermission(null)
    setCameras([])
    setSelectedCamera('')
    onClose()
  }

  const handleModeChange = async (newMode) => {
    await stopCamera()
    setScanMode(newMode)
    setError('')
    setScannedData(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Scan Cart QR Code</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!scannedData ? (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleModeChange('camera')}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                  scanMode === 'camera' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Camera className="h-5 w-5" />
                Camera
              </button>
              <button
                onClick={() => handleModeChange('upload')}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                  scanMode === 'upload' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Upload className="h-5 w-5" />
                Upload
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {scanMode === 'camera' && (
              <div className="space-y-4">
                {cameras.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Camera:</label>
                    <select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {cameras.map(camera => {
                        const label = camera.label || `Camera ${camera.id}`
                        const isVirtual = label.toLowerCase().includes('obs') || 
                                        label.toLowerCase().includes('virtual') ||
                                        label.toLowerCase().includes('manycam')
                        
                        return (
                          <option key={camera.id} value={camera.id}>
                            {label} {isVirtual ? '(Virtual)' : ''}
                          </option>
                        )
                      })}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Tip: Select your built-in laptop camera, not OBS Virtual Camera
                    </p>
                  </div>
                )}
                
                <div 
                  id="camera-qr-reader" 
                  className="w-full min-h-[300px] bg-black rounded-lg overflow-hidden"
                ></div>
                
                <p className="text-sm text-gray-500 text-center">
                  Position QR code within the frame
                </p>
              </div>
            )}

            {scanMode === 'upload' && (
              <div>
                <div id="upload-qr-reader" className="hidden"></div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <label className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <span className="text-sm text-gray-600 block mb-2">
                      Click to upload QR code image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">QR Code Scanned!</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{scannedData.customer_name || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{scannedData.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-lg">₱{scannedData.subtotal.toFixed(2)}</span>
              </div>
              {scannedData.special_requests && (
                <div className="pt-2 border-t">
                  <span className="text-gray-600 text-sm">Special Requests:</span>
                  <p className="text-sm mt-1">{scannedData.special_requests}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRescan}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Scan Again
              </button>
              <button
                onClick={handleCreateOrder}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Create Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartQRScanner
