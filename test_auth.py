#!/usr/bin/env python3
"""
Test authentication and API access
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth():
    print("Testing authentication...")
    
    # Test registration
    register_data = {
        "username": "testuser",
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/user/register/", json=register_data)
        print(f"Registration status: {response.status_code}")
        if response.status_code == 201:
            print("User registered successfully")
        else:
            print("Registration error:", response.text)
    except Exception as e:
        print(f"Registration error: {e}")
    
    # Test login
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/token/", json=login_data)
        print(f"Login status: {response.status_code}")
        if response.status_code == 200:
            token_data = response.json()
            print("Login successful, got token")
            
            # Test authenticated request
            headers = {"Authorization": f"Bearer {token_data['access']}"}
            response = requests.get(f"{BASE_URL}/inventory/units/", headers=headers)
            print(f"Authenticated units request status: {response.status_code}")
            if response.status_code == 200:
                print("Units data:", response.json())
            else:
                print("Units error:", response.text)
        else:
            print("Login error:", response.text)
    except Exception as e:
        print(f"Login error: {e}")

if __name__ == "__main__":
    test_auth()

