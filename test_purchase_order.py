#!/usr/bin/env python3
"""
Test script to debug purchase order creation
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_purchase_order():
    print("Testing purchase order creation...")
    
    # First, let's test if we can get units
    try:
        response = requests.get(f"{BASE_URL}/inventory/units/")
        print(f"Units endpoint status: {response.status_code}")
        if response.status_code == 200:
            units = response.json()
            print(f"Found {len(units)} units:")
            for unit in units:
                print(f"  - {unit['name']} ({unit['abbreviation']}) - ID: {unit['id']}")
        else:
            print("Units error:", response.text)
            return
    except Exception as e:
        print(f"Units endpoint error: {e}")
        return
    
    # Test authentication
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/token/", json=login_data)
        if response.status_code != 200:
            print("Login failed, trying to register...")
            register_data = {
                "username": "testuser",
                "email": "test@example.com",
                "first_name": "Test",
                "last_name": "User",
                "password": "testpass123"
            }
            response = requests.post(f"{BASE_URL}/api/user/register/", json=register_data)
            print(f"Registration status: {response.status_code}")
            
            # Try login again
            response = requests.post(f"{BASE_URL}/api/token/", json=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            headers = {"Authorization": f"Bearer {token_data['access']}"}
            print("Authentication successful")
        else:
            print("Authentication failed:", response.text)
            return
    except Exception as e:
        print(f"Authentication error: {e}")
        return
    
    # Test purchase order creation
    if units:
        purchase_order_data = {
            "purchase_date": "2024-01-16",
            "notes": "Test purchase order",
            "items": [
                {
                    "name": "Test Item",
                    "quantity": 10.0,
                    "unit": units[0]['id'],  # Use first unit's ID
                    "unit_price": 5.50,
                    "total_price": 55.0
                }
            ]
        }
        
        try:
            print(f"Creating purchase order with data: {json.dumps(purchase_order_data, indent=2)}")
            response = requests.post(f"{BASE_URL}/inventory/purchase-orders/", 
                                   json=purchase_order_data, 
                                   headers=headers)
            print(f"Purchase order creation status: {response.status_code}")
            if response.status_code == 201:
                print("Purchase order created successfully!")
                print("Response:", response.json())
            else:
                print("Purchase order creation failed:")
                print("Response:", response.text)
        except Exception as e:
            print(f"Purchase order creation error: {e}")

if __name__ == "__main__":
    test_purchase_order()

