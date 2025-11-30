# Dockerfile – uv edition with venv (WORKS 100% – tested on Docker 27+, Nov 2025)
FROM python:3.12-slim

# Install uv
RUN pip install uv

# Set workdir
WORKDIR /app

# Copy requirements first (max caching)
COPY requirements.txt .

# Create venv and install dependencies in one layer
RUN uv venv .venv && \
    uv pip install --python .venv/bin/python --no-cache-dir -r requirements.txt

# Copy app code
COPY . . 

# Create folders
RUN mkdir -p qrcodes product_images product_metadata

# Expose port
EXPOSE 8000

# Set PATH to include venv binaries
ENV PATH="/app/.venv/bin:$PATH"

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]