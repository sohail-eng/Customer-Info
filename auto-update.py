import subprocess
import sys

file_path = "website_password.txt"  # File holding the website password (e.g. IP)

def main():
    if len(sys.argv) < 2:
        print("Usage: python update_and_push.py '<new_website_password_or_ip>'")
        sys.exit(1)

    new_password = sys.argv[1]

    with open(file_path, "r", encoding="utf-8") as f:
        current_password = f.read().strip()

    if new_password == current_password:
        print("Tunnel password/IP is unchanged. No update needed.")
        return

    # Write the new tunnel password (usually an IP) exactly as provided
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_password)
    print(f"{file_path} updated with new tunnel password/IP.")

    try:
        subprocess.run(["git", "add", file_path], check=True)
        print("Staged the updated tunnel password file.")

        commit_msg = f"Update tunnel password to '{new_password}'"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        print("Committed the updated tunnel password.")

        subprocess.run(["git", "push"], check=True)
        print("Pushed the updated tunnel password to remote repo.")

    except subprocess.CalledProcessError as e:
        print(f"Git operation failed: {e}")

if __name__ == "__main__":
    main()
