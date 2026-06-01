#!/bin/bash

# Exit immediately if a command fails
set -e

# Error logging function
log_error() {
  echo "An error occurred in command: '$BASH_COMMAND'. Exiting..." >&2
}

# Trap any errors and call the log_error function
trap 'log_error' ERR

# Prompt for clock correctness
echo "The clock on the smartbox must be correct (preferably NTP setup completed) or some handshakes for bootstrapping may fail. (Smartbox的时钟必须正确（最好完成 NTP 设置），否则某些引导握手可能会失败。)"
read -p "[Y/y]es (continue)（继续）, [N/n]o (abort)（中止）: " user_input

if [[ "$user_input" =~ ^[Yy]$ ]]; then
  echo "Proceeding with the setup..."
elif [[ "$user_input" =~ ^[Nn]$ ]]; then
  echo "Aborting the setup. Please ensure the clock is correct before proceeding."
  exit 1
else
  echo "Invalid input. Please enter Y/y for yes or N/n for no."
  exit 1
fi

# Function to check if Node.js is installed and its version
check_node_version() {
  if command -v node >/dev/null 2>&1 || command -v nodejs >/dev/null 2>&1; then
    NODE_BIN=$(command -v node || command -v nodejs)
    NODE_VERSION=$($NODE_BIN -v | sed 's/v//')  # Get the version without 'v' prefix
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
    if [ "$NODE_MAJOR_VERSION" -ge 12 ]; then
      echo "Node.js version $NODE_VERSION is already installed."
      return 0  # Node.js is at version 12 or higher
    else
      echo "Node.js version $NODE_VERSION is below 12. Will update Node.js."
      return 1  # Node.js is below version 12
    fi
  else
    echo "Node.js is not installed. Will install Node.js version 12."
    return 1  # Node.js is not installed
  fi
}

# Install Node.js if not present or version is below 12
install_node() {
  echo "Setting up Node.js version 12 repository..."
  apt install -y curl
  
  # Remove existing Node.js installation if version < 12
  if command -v node >/dev/null 2>&1 || command -v nodejs >/dev/null 2>&1; then
    NODE_BIN=$(command -v node || command -v nodejs)
    NODE_VERSION=$($NODE_BIN -v | sed 's/v//')
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
    if [ "$NODE_MAJOR_VERSION" -lt 12 ]; then
      echo "Removing existing Node.js version $NODE_VERSION..."
      sudo apt remove -y nodejs npm
      sudo apt purge -y nodejs npm
      sudo apt autoremove -y
    fi
  fi
  
  dos2unix setup_12.x && chmod a+x setup_12.x && ./setup_12.x

  echo "Updating package list..."
  sudo apt update

  echo "Installing Node.js and npm..."
  sudo apt install -y nodejs
}

# Run npm install with no optional dependencies
install_npm_dependencies() {
  echo "Running npm install --no-optional... (this might take some time)"
  sudo npm install --no-optional
}

# Check if PM2 is installed and install it if not
install_pm2() {
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "PM2 is not installed. Installing PM2... (this might take some time)"
    sudo npm install -g pm2
  else
    echo "PM2 is already installed."
  fi
}

# Set up PM2 to run the Node.js app on boot
setup_pm2_startup() {
  # Get the directory of the script
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  # Change to the script's directory
  cd "$script_dir" || {
    echo "Failed to change to script directory: $script_dir"
    exit 1
  }
  echo "Changed to script directory: $script_dir"

  # Check if the app already exists in PM2
  pm2 describe nodeapp >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "PM2 app 'nodeapp' already exists. Restarting..."
    pm2 restart nodeapp
  else
    echo "Starting new PM2 app 'nodeapp'..."
    pm2 start npm --name "nodeapp" -- start
  fi

  # Save the PM2 process list
  pm2 save

  # Set up PM2 to start on boot
  sudo pm2 startup systemd -u root --hp /root
}

apt update
apt install --reinstall ca-certificates

# Main logic
if ! check_node_version; then
  install_node
  
  # Recheck Node.js version after installation
  if ! check_node_version; then
    echo -e "Unable to install the required Node.js version automatically. Exiting..."
    exit 1
  fi
fi

install_npm_dependencies
install_pm2
setup_pm2_startup
