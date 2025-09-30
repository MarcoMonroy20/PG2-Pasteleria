#!/usr/bin/env node

/**
 * Firebase Setup Script
 * Automates the creation and configuration of Firebase project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Setup Script');
console.log('========================\n');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.log('❌ Firebase CLI not found. Installing...');
  try {
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    console.log('✅ Firebase CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Firebase CLI:', installError.message);
    process.exit(1);
  }
}

// Create .firebaserc file
const firebaseConfig = {
  projects: {
    default: "pasteleria-cocina-app"
  }
};

fs.writeFileSync('.firebaserc', JSON.stringify(firebaseConfig, null, 2));
console.log('✅ Created .firebaserc file');

// Create firebase.json file
const firebaseJson = {
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "web-build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
};

fs.writeFileSync('firebase.json', JSON.stringify(firebaseJson, null, 2));
console.log('✅ Created firebase.json file');

// Create Firestore rules
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow anonymous access for demo purposes
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`;

fs.writeFileSync('firestore.rules', firestoreRules);
console.log('✅ Created firestore.rules file');

// Create Firestore indexes
const firestoreIndexes = {
  "indexes": [
    {
      "collectionGroup": "pedidos",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "fechaEntrega",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "estado",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
};

fs.writeFileSync('firestore.indexes.json', JSON.stringify(firestoreIndexes, null, 2));
console.log('✅ Created firestore.indexes.json file');

console.log('\n🎉 Firebase configuration files created!');
console.log('\nNext steps:');
console.log('1. Run: firebase login');
console.log('2. Run: firebase init');
console.log('3. Select Firestore and Hosting');
console.log('4. Run: firebase deploy');
console.log('\nOr visit: https://console.firebase.google.com/');
console.log('Create project: pasteleria-cocina-app');
