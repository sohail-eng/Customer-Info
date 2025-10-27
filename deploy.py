import os
import uuid
import subprocess
import time
import requests

def run_localtunnel(port=8000):
    subdomain = "sohail-dcd82306-4436-4b08-b98e-0f343df8eafc"
    print(f"[INFO] Starting LocalTunnel with subdomain: {subdomain}")

    while True:
        try:
            # Run the lt command with the generated subdomain
            command = ["lt", "--port", str(port), "--subdomain", subdomain]
            process = subprocess.Popen(command)

            pass_ip = requests.get("https://loca.lt/mytunnelpassword").text

            command = ["python", "auto-update.py", pass_ip]
            subprocess.Popen(command)

            # Wait for process to finish or crash
            process.wait()

            print(f"[WARNING] LocalTunnel exited. Restarting in 5 seconds...")
            time.sleep(5)

        except KeyboardInterrupt:
            print("[INFO] Stopping tunnel by user request.")
            process.terminate()
            break
        except Exception as e:
            print(f"[ERROR] An error occurred: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_localtunnel()
