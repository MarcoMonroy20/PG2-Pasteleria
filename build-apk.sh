#!/bin/bash

echo "========================================"
echo "    PASTELERIA COCINA - BUILD APK"
echo "========================================"
echo

echo "[1/4] Verificando dependencias..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo al instalar dependencias"
    exit 1
fi

echo
echo "[2/4] Verificando configuracion..."
npx expo-doctor
if [ $? -ne 0 ]; then
    echo "ADVERTENCIA: Hay problemas de configuracion, pero continuando..."
fi

echo
echo "[3/4] Iniciando build de APK..."
echo "NOTA: Necesitas tener una cuenta de Expo (gratuita)"
echo "Si no tienes cuenta, ve a: https://expo.dev"
echo
npx eas build --platform android --profile preview
if [ $? -ne 0 ]; then
    echo "ERROR: Fallo al generar APK"
    exit 1
fi

echo
echo "[4/4] ¡APK generado exitosamente!"
echo "El APK estara disponible en: https://expo.dev"
echo

