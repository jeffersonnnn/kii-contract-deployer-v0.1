#!/bin/bash

set -e

echo "Starting KiiChain Validator setup..."

# Function to log messages
log_message() {
    echo "$(date): $1"
}

# Function to handle errors
handle_error() {
    log_message "Error occurred in line $1"
    log_message "Continuing with the setup process..."
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Detect OS
OS=$(uname -s)
log_message "Detected OS: $OS"

if [ "$OS" == "Darwin" ]; then
    log_message "Setting up for macOS..."
    
    # Update Homebrew
    log_message "Updating Homebrew..."
    brew update || log_message "Homebrew update failed, continuing with existing packages"

    # Install/Update Go
    log_message "Installing/Updating Go..."
    brew install go || brew upgrade go || log_message "Go installation/update failed, continuing with existing version"

    # Install other dependencies
    log_message "Installing other dependencies..."
    brew install protobuf gcc make jq wget git || log_message "Some dependencies may not have installed correctly"
elif [ "$OS" == "Linux" ]; then
    log_message "Setting up for Linux..."
    # Linux-specific setup code here
    # ...
else
    log_message "Unsupported OS: $OS"
    exit 1
fi

# Set up Go environment variables
log_message "Setting up Go environment..."
GO_ENV_SETUP="export PATH=\$PATH:/usr/local/go/bin
export GOPATH=\$HOME/go
export PATH=\$PATH:\$GOPATH/bin"

SHELL_NAME=$(basename "$SHELL")
if [ "$SHELL_NAME" == "zsh" ]; then
    echo "$GO_ENV_SETUP" >> $HOME/.zshrc
    log_message "Go environment variables added to .zshrc"
elif [ "$SHELL_NAME" == "bash" ]; then
    echo "$GO_ENV_SETUP" >> $HOME/.bash_profile
    log_message "Go environment variables added to .bash_profile"
else
    echo "$GO_ENV_SETUP" >> $HOME/.profile
    log_message "Go environment variables added to .profile"
fi

# Temporarily set Go environment variables for the current script
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# Verify Go installation
log_message "Verifying Go installation..."
if command -v go &>/dev/null; then
    go_version=$(go version)
    log_message "Go is installed: $go_version"
else
    log_message "Go is not installed or not in PATH"
    exit 1
fi

# Clean Go module cache
log_message "Cleaning Go module cache..."
go clean -modcache

# Install Ignite CLI
log_message "Installing Ignite CLI..."
curl https://get.ignite.com/cli@v0.27.1! | bash

# Verify Ignite CLI installation
log_message "Verifying Ignite CLI installation..."
if command -v ignite &>/dev/null; then
    ignite_version=$(ignite version)
    log_message "Ignite CLI is installed: $ignite_version"
else
    log_message "Ignite CLI is not installed or not in PATH"
    exit 1
fi

# Install KiiChain
log_message "Installing KiiChain..."
if [ -d "kii" ]; then
    log_message "The 'kii' directory already exists. Do you want to remove it and re-clone the repository? (yes/no)"
    read -r response
    if [ "$response" == "yes" ]; then
        rm -rf kii
        git clone https://github.com/KiiBlockchain/kii.git
    else
        log_message "Skipping KiiChain installation."
    fi
else
    git clone https://github.com/KiiBlockchain/kii.git
fi

log_message "Changing directory to kii..."
cd kii || exit

# Install Go dependencies
log_message "Installing Go dependencies..."
go mod tidy
go mod download

log_message "Initializing KiiChain..."
ignite chain init

# Verify installation
log_message "Verifying KiiChain installation..."
if command -v kiichaind &>/dev/null; then
    kiichain_version=$(kiichaind version)
    log_message "KiiChain is installed: $kiichain_version"
else
    log_message "KiiChain is not installed or not in PATH"
    exit 1
fi

log_message "KiiChain Validator setup completed!"
echo "IMPORTANT: To apply the changes, please run the following command or start a new terminal session:"
echo "source \$HOME/.${SHELL_NAME}rc"