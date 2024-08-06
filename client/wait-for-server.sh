#!/bin/bash

# Funzione per controllare se il server è pronto
wait_for_server() {
  local server_url=$1
  local retries=20
  local count=0

  until curl -s $server_url > /dev/null; do
    echo "Server non pronto, attesa..."
    sleep 5
    count=$((count + 1))
    if [ "$count" -ge "$retries" ]; then
      echo "Il server non è stato trovato dopo $retries tentativi. Abbandono."
      exit 1
    fi
  done

  echo "Server pronto!"
}

# Indirizzo del server
SERVER_URL="http://server:8080"

# Attendere che il server sia pronto
wait_for_server $SERVER_URL

# Avviare il client
exec npm run dev
