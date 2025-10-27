#!/bin/bash
# Script para encriptar/desencriptar .env

if [ "$1" == "encrypt" ]; then
    echo "Encriptando .env..."
    openssl enc -aes-256-cbc -salt -in .env -out .env.encrypted -pbkdf2
    echo "✅ Archivo encriptado: .env.encrypted"
    echo "Ahora puedes subirlo a GitHub"
elif [ "$1" == "decrypt" ]; then
    echo "Desencriptando .env.encrypted..."
    openssl enc -aes-256-cbc -d -in .env.encrypted -out .env -pbkdf2
    echo "✅ Archivo desencriptado: .env"
else
    echo "Uso:"
    echo "  bash encrypt-env.sh encrypt   # Para encriptar .env"
    echo "  bash encrypt-env.sh decrypt   # Para desencriptar .env.encrypted"
fi
