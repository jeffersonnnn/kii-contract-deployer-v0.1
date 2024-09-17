if [ -n "$BASH_VERSION" ]; then
  # Add Go environment variables
  export PATH=$PATH:/usr/local/go/bin
  export GOPATH=$HOME/go
  export PATH=$PATH:$GOPATH/bin
fi