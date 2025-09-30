@echo off
echo ========================================
echo    PASTELERIA COCINA - BUILD APK
echo ========================================
echo.

echo [1/4] Verificando dependencias...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ERROR: Fallo al instalar dependencias
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando configuracion...
call npx expo-doctor
if %errorlevel% neq 0 (
    echo ADVERTENCIA: Hay problemas de configuracion, pero continuando...
)

echo.
echo [3/4] Iniciando build de APK...
echo NOTA: Necesitas tener una cuenta de Expo (gratuita)
echo Si no tienes cuenta, ve a: https://expo.dev
echo.
call npx eas build --platform android --profile preview
if %errorlevel% neq 0 (
    echo ERROR: Fallo al generar APK
    pause
    exit /b 1
)

echo.
echo [4/4] ¡APK generado exitosamente!
echo El APK estara disponible en: https://expo.dev
echo.
pause

