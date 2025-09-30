#!/bin/bash

echo "========================================"
echo "   COMPILACION DE APK OPTIMIZADA"
echo "   Pasteleria Cocina App v1.0.0"
echo "========================================"
echo

echo "[1/6] Verificando configuracion..."
if [ ! -f ".env.local" ]; then
    echo "ERROR: Archivo .env.local no encontrado"
    echo "Por favor, crea el archivo .env.local con las credenciales de Firebase"
    exit 1
fi

echo "[2/6] Verificando EAS CLI..."
if ! command -v eas &> /dev/null; then
    echo "ERROR: EAS CLI no esta instalado"
    echo "Instalando EAS CLI..."
    npm install -g @expo/eas-cli
fi

echo "[3/6] Verificando login de EAS..."
if ! eas whoami &> /dev/null; then
    echo "ERROR: No estas logueado en EAS"
    echo "Iniciando sesion..."
    eas login
fi

echo "[4/6] Limpiando cache..."
npx expo install --fix
npm run prebuild:clean

echo "[5/6] Iniciando compilacion..."
echo "Compilando APK para Android..."
echo "Esto puede tomar varios minutos..."
echo

eas build --platform android --profile preview --non-interactive

if [ $? -eq 0 ]; then
    echo
    echo "========================================"
    echo "   COMPILACION EXITOSA!"
    echo "========================================"
    echo
    echo "La APK se ha generado correctamente"
    echo "Puedes descargarla desde: https://expo.dev/accounts/[tu-usuario]/projects/pasteleria-cocina-app/builds"
    echo
    echo "Caracteristicas incluidas:"
    echo "- Sincronizacion automatica con Firebase"
    echo "- Notificaciones locales y push"
    echo "- Interfaz responsive optimizada"
    echo "- Soporte offline completo"
    echo "- Multi-rol (Admin, Dueno, Repostero)"
    echo
else
    echo
    echo "========================================"
    echo "   ERROR EN LA COMPILACION"
    echo "========================================"
    echo
    echo "Revisa los logs anteriores para mas detalles"
    echo
fi

echo "Presiona Enter para continuar..."
read
