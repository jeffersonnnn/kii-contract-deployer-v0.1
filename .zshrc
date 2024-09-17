if [ -n "$ZSH_VERSION" ]; then
  autoload -Uz compinit
  compinit
fi

# Add Go environment variables
export PATH=$PATH:/usr/local/go/bin
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin