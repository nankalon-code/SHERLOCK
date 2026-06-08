import sys
print(sys.executable)
import subprocess
result = subprocess.run(["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"], 
                       capture_output=False)
