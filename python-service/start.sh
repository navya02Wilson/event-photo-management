#!/bin/bash
# Start script for Python Face Recognition Service

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Set default port if not set
export PYTHON_SERVICE_PORT=${PYTHON_SERVICE_PORT:-8000}
export PYTHON_SERVICE_HOST=${PYTHON_SERVICE_HOST:-127.0.0.1}

# Run the service
python main.py










