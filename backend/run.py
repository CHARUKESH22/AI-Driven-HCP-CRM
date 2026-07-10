import uvicorn
import os

if __name__ == "__main__":
    # Start uvicorn server
    # Host on 0.0.0.0 for access within local network, port 8000
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
