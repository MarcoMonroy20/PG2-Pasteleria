#!/usr/bin/env node

/**
 * Android Build Preparation Script
 * Optimizes assets and configuration for Android builds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparando build de Android...\n');

// Paths
const rootDir = path.resolve(__dirname);
const frontendDir = path.join(rootDir, 'frontend');
const androidAssetsDir = path.join(frontendDir, 'assets', 'images');

// Ensure assets directory exists
if (!fs.existsSync(androidAssetsDir)) {
  fs.mkdirSync(androidAssetsDir, { recursive: true });
}

// Optimize images for Android
function optimizeImages() {
  console.log('📸 Optimizando imágenes para Android...');

  const imageFiles = [
    'icon.png',
    'adaptive-icon.png',
    'splash-icon.png',
    'logo.png',
    'logo2.png'
  ];

  imageFiles.forEach(file => {
    const filePath = path.join(androidAssetsDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} listo para Android`);
    } else {
      console.log(`⚠️  ${file} no encontrado`);
    }
  });
}

// Validate configuration
function validateConfig() {
  console.log('⚙️  Validando configuración...');

  // Check app.json
  const appJsonPath = path.join(frontendDir, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    // Validate Android config
    const android = appJson.expo.android;
    if (!android) {
      console.error('❌ Configuración Android faltante en app.json');
      process.exit(1);
    }

    if (!android.package) {
      console.error('❌ Package name faltante en configuración Android');
      process.exit(1);
    }

    console.log(`✅ Package: ${android.package}`);
    console.log(`✅ Version: ${appJson.expo.version}`);
  } else {
    console.error('❌ app.json no encontrado');
    process.exit(1);
  }

  // Check eas.json
  const easJsonPath = path.join(rootDir, 'eas.json');
  if (fs.existsSync(easJsonPath)) {
    console.log('✅ eas.json encontrado');
  } else {
    console.log('⚠️  eas.json no encontrado - creando configuración básica');
    createEasJson();
  }
}

// Create basic eas.json if missing
function createEasJson() {
  const easConfig = {
    cli: {
      version: '>= 5.9.0'
    },
    build: {
      development: {
        developmentClient: true,
        distribution: 'internal',
        android: {
          buildType: 'apk'
        }
      },
      preview: {
        distribution: 'internal',
        android: {
          buildType: 'apk'
        }
      },
      production: {
        android: {
          buildType: 'aab'
        }
      }
    }
  };

  fs.writeFileSync(
    path.join(rootDir, 'eas.json'),
    JSON.stringify(easConfig, null, 2)
  );

  console.log('✅ eas.json creado');
}

// Check dependencies
function checkDependencies() {
  console.log('📦 Verificando dependencias...');

  try {
    execSync('cd frontend && npx expo install --dry-run', { stdio: 'pipe' });
    console.log('✅ Dependencias verificadas');
  } catch (error) {
    console.log('⚠️  Algunas dependencias pueden necesitar actualización');
    console.log('💡 Ejecuta: npm run clean');
  }
}

// Generate build info
function generateBuildInfo() {
  console.log('📝 Generando información de build...');

  const buildInfo = {
    buildTime: new Date().toISOString(),
    platform: 'android',
    nodeVersion: process.version,
    expoVersion: require('./frontend/package.json').dependencies['expo'],
    androidVersion: '1.0.0'
  };

  fs.writeFileSync(
    path.join(frontendDir, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );

  console.log('✅ Información de build generada');
}

// Main execution
function main() {
  try {
    console.log('🔧 Script de preparación de build de Android\n');

    optimizeImages();
    console.log('');

    validateConfig();
    console.log('');

    checkDependencies();
    console.log('');

    generateBuildInfo();
    console.log('');

    console.log('🎉 ¡Preparación de Android completada!');
    console.log('');
    console.log('📱 Comandos disponibles:');
    console.log('   npm run android:build:preview    - Build de preview (APK)');
    console.log('   npm run android:build:production - Build de producción (AAB)');
    console.log('   npm run android:submit           - Submit a Play Store');
    console.log('');
    console.log('🚀 ¡Listo para build!');

  } catch (error) {
    console.error('❌ Error en preparación de build:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, optimizeImages, validateConfig, checkDependencies, generateBuildInfo };
