# OWASP Visualization Setup Instructions

## Problem Fixed

The OWASP knowledge tree visualization was not loading because:

1. **Data Fetching Issue**: The React component was using hardcoded data instead of fetching from the Flask backend
2. **Missing API Endpoint**: No API endpoint existed to serve OWASP data to the frontend
3. **CORS Issues**: Flask backend didn't have CORS enabled for frontend communication
4. **Data Format Mismatch**: The component expected different data structure than what was available

## Solution Implemented

### Backend Changes (Flask)

1. **Added API Endpoint**: Created `/api/owasp-data` endpoint in `routes.py`
2. **Enabled CORS**: Added `flask-cors` dependency and configured CORS in `app.py`
3. **Updated Dependencies**: Added `flask-cors>=4.0.0` to `pyproject.toml`

### Frontend Changes (Next.js)

1. **Data Fetching**: Updated `components/OWASPTreeVisualization.tsx` to fetch data from backend
2. **Loading States**: Added proper loading and error states
3. **Fallback Data**: Added fallback data if backend is not available
4. **Data Structure**: Updated component to work with the actual JSON data format

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### 1. Install Backend Dependencies

```bash
# Install Python dependencies
pip install -e .

# Or if using uv
uv sync
```

### 2. Install Frontend Dependencies

```bash
# Install Node.js dependencies
npm install
```

### 3. Start the Backend (Flask)

```bash
# Start Flask backend on port 5000
python app.py
```

### 4. Start the Frontend (Next.js)

```bash
# In a new terminal, start Next.js on port 3000
npm run dev
```

### 5. Access the Application

Open your browser and go to: http://localhost:3000

## Testing

Run the test script to verify everything is working:

```bash
python test_setup.py
```

## How It Works

1. **Frontend**: Next.js app loads and displays the OWASP visualization
2. **Data Fetching**: Component tries to fetch data from `http://localhost:5000/api/owasp-data`
3. **Backend**: Flask serves OWASP data from `data/owasp_tree.json`
4. **Fallback**: If backend is unavailable, component uses hardcoded fallback data
5. **Visualization**: React Flow renders the interactive knowledge tree

## File Structure

```
├── components/
│   └── OWASPTreeVisualization.tsx  # Main visualization component
├── pages/
│   └── index.tsx                   # Next.js main page
├── data/
│   └── owasp_tree.json            # OWASP data source
├── app.py                         # Flask application
├── routes.py                      # Flask routes (includes API endpoint)
└── test_setup.py                  # Test script
```

## Troubleshooting

### Backend Issues
- Make sure Flask is running on port 5000
- Check if `flask-cors` is installed
- Verify `data/owasp_tree.json` exists and is valid JSON

### Frontend Issues
- Make sure Next.js is running on port 3000
- Check browser console for errors
- Verify React Flow dependencies are installed

### CORS Issues
- Ensure Flask backend has CORS enabled
- Check that frontend is accessing the correct backend URL
- Verify both servers are running on expected ports

## Features

- ✅ Interactive OWASP Top 10 visualization
- ✅ Search functionality
- ✅ Risk level color coding
- ✅ Expandable vulnerability details
- ✅ Responsive design
- ✅ Loading and error states
- ✅ Backend integration with fallback
