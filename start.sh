#!/bin/bash

# Activate virtual environment and start Django server
source env/bin/activate
cd backend
python manage.py runserver &
# The ampersand (&) runs Django in the background

# Start frontend dev server
cd ../frontend
npm run dev