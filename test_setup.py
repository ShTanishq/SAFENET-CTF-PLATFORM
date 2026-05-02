#!/usr/bin/env python3
"""
Test script to verify the OWASP visualization setup
"""

import requests
import json
import sys

def test_backend_api():
    """Test if the Flask backend API is working"""
    try:
        print("Testing Flask backend API...")
        response = requests.get('http://localhost:5000/api/owasp-data', timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Backend API is working correctly")
                print(f"   Found {len(data.get('data', []))} OWASP vulnerabilities")
                return True
            else:
                print("❌ Backend API returned error:", data.get('error'))
                return False
        else:
            print(f"❌ Backend API returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Flask backend (is it running on port 5000?)")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def test_data_file():
    """Test if the OWASP data file exists and is valid"""
    try:
        print("Testing OWASP data file...")
        with open('data/owasp_tree.json', 'r') as f:
            data = json.load(f)
        
        if isinstance(data, list) and len(data) > 0:
            print("✅ OWASP data file is valid")
            print(f"   Found {len(data)} OWASP vulnerabilities")
            return True
        else:
            print("❌ OWASP data file is empty or invalid")
            return False
    except FileNotFoundError:
        print("❌ OWASP data file not found")
        return False
    except json.JSONDecodeError:
        print("❌ OWASP data file contains invalid JSON")
        return False
    except Exception as e:
        print(f"❌ Error reading data file: {e}")
        return False

def main():
    """Run all tests"""
    print("🔍 Testing OWASP Visualization Setup")
    print("=" * 40)
    
    backend_ok = test_backend_api()
    data_ok = test_data_file()
    
    print("\n" + "=" * 40)
    if backend_ok and data_ok:
        print("🎉 All tests passed! The visualization should work correctly.")
        print("\nTo start the application:")
        print("1. Start Flask backend: python app.py")
        print("2. Start Next.js frontend: npm run dev")
        print("3. Open http://localhost:3000 in your browser")
    else:
        print("❌ Some tests failed. Please check the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
