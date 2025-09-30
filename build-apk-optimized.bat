@echo off
echo ========================================
echo    COMPILACION DE APK OPTIMIZADA
echo    Pasteleria Cocina App v1.0.0
echo ========================================
echo.

echo [1/6] Verificando configuracion...
if not exist ".env.local" (
    echo ERROR: Archivo .env.local no encontrado
    echo Por favor, crea el archivo .env.local con las credenciales de Firebase
    pause
    exit /b 1
)

echo [2/6] Verificando EAS CLI...
eas --version
if %errorlevel% neq 0 (
    echo ERROR: EAS CLI no esta instalado
    echo Instalando EAS CLI...
    npm install -g @expo/eas-cli
)

echo [3/6] Verificando login de EAS...
eas whoami
if %errorlevel% neq 0 (
    echo ERROR: No estas logueado en EAS
    echo Iniciando sesion...
    eas login
)

echo [4/6] Limpiando cache...
npx expo install --fix
npm run prebuild:clean

echo [5/6] Iniciando compilacion...
echo Compilando APK para Android...
echo Esto puede tomar varios minutos...
echo.

eas build --platform android --profile preview --non-interactive

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    COMPILACION EXITOSA!
    echo ========================================
    echo.
    echo La APK se ha generado correctamente
    echo Puedes descargarla desde: https://expo.dev/accounts/[tu-usuario]/projects/pasteleria-cocina-app/builds
    echo.
    echo Caracteristicas incluidas:
    echo - Sincronizacion automatica con Firebase
    echo - Notificaciones locales y push
    echo - Interfaz responsive optimizada
    echo - Soporte offline completo
    echo - Multi-rol (Admin, Dueno, Repostero)
    echo.
) else (
    echo.
    echo ========================================
    echo    ERROR EN LA COMPILACION
    echo ========================================
    echo.
    echo Revisa los logs anteriores para mas detalles
    echo.
)

echo Presiona cualquier tecla para continuar...
pause >nul
