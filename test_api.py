#!/usr/bin/env python3
"""
Simple test script to check if the API endpoints are working
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("Testing API endpoints...")
    
    # Test units endpoint
    try:
        response = requests.get(f"{BASE_URL}/inventory/units/")
        print(f"Units endpoint status: {response.status_code}")
        if response.status_code == 200:
            print("Units data:", response.json())
        else:
            print("Units error:", response.text)
    except Exception as e:
        print(f"Units endpoint error: {e}")
    
    # Test raw materials endpoint
    try:
        response = requests.get(f"{BASE_URL}/inventory/rawmaterials/")
        print(f"Raw materials endpoint status: {response.status_code}")
        if response.status_code == 200:
            print("Raw materials data:", response.json())
        else:
            print("Raw materials error:", response.text)
    except Exception as e:
        print(f"Raw materials endpoint error: {e}")
    
    # Test purchase orders endpoint
    try:
        response = requests.get(f"{BASE_URL}/inventory/purchase-orders/")
        print(f"Purchase orders endpoint status: {response.status_code}")
        if response.status_code == 200:
            print("Purchase orders data:", response.json())
        else:
            print("Purchase orders error:", response.text)
    except Exception as e:
        print(f"Purchase orders endpoint error: {e}")

if __name__ == "__main__":
    test_endpoints()
