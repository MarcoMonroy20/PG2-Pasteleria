// Hybrid Image Service
// Combines Cloudinary (cloud) with local storage (offline)
// Automatic sync when connection is restored

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLOUDINARY_ENABLED, CLOUDINARY_UPLOAD_URL, cloudinaryConfig } from '../cloudinary.config';
import NetworkManager from './network-manager';
import { FirebaseSync } from './firebase';

export interface ImageReference {
  pedidoId: number;
  cloudinaryUrl?: string; // URL de Cloudinary
  localPath?: string; // Ruta local como fallback
  uploaded: boolean; // Si se subió a Cloudinary
  createdAt: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  localPath?: string;
}

class HybridImageService {
  private static STORAGE_KEY = 'pasteleria_image_references';
  private static PENDING_UPLOADS_KEY = 'pasteleria_pending_uploads';

  // Upload image to Cloudinary
  static async uploadToCloudinary(imageUri: string, pedidoId: number): Promise<UploadResult> {
    if (!CLOUDINARY_ENABLED) {
      console.log('📷 Cloudinary disabled, saving locally only');
      return {
        success: true,
        localPath: imageUri,
        url: imageUri
      };
    }

    try {
      console.log('☁️ Uploading image to Cloudinary for pedido:', pedidoId);
      console.log('🔍 Image URI:', imageUri);
      console.log('🔍 Upload preset:', cloudinaryConfig.uploadPreset);
      console.log('🔍 Upload URL:', CLOUDINARY_UPLOAD_URL);

      // Create FormData for upload
      const formData = new FormData();
      const filename = `pedido_${pedidoId}_${Date.now()}.jpg`;
      
      // Handle different image URI formats (typing compatible con RN + Web)
      if (imageUri.startsWith('blob:')) {
        // Web blob URL - need to fetch the blob first
        console.log('🔍 Fetching blob from web URL...');
        const response = await fetch(imageUri);
        const blob = await response.blob();
        // Tipa como any y pasa filename para ajustar a la sobrecarga válida del DOM
        formData.append('file', blob as any, filename);
      } else {
        // File URI for mobile (React Native)
        formData.append('file', { uri: imageUri, type: 'image/jpeg', name: filename } as any);
      }
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      // Remove folder and public_id to avoid conflicts
      // formData.append('folder', 'pasteleria-cocina');
      // formData.append('public_id', `pedido_${pedidoId}_${Date.now()}`);

      console.log('🔍 FormData prepared, sending to Cloudinary...');

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary
      });

      console.log('🔍 Cloudinary response status:', response.status);
      console.log('🔍 Cloudinary response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Cloudinary error response:', errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Image uploaded to Cloudinary:', result.secure_url);

      return {
        success: true,
        url: result.secure_url,
        localPath: imageUri // Keep local as backup
      };

    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error);
      
      // Save to pending uploads for later sync
      await this.addToPendingUploads(pedidoId, imageUri);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        localPath: imageUri
      };
    }
  }

  // Save image reference (hybrid)
  static async saveImageReference(pedidoId: number, imageUri: string): Promise<ImageReference> {
    const networkManager = NetworkManager.getInstance();
    const isOnline = networkManager.isOnlineStatus();

    let imageRef: ImageReference = {
      pedidoId,
      localPath: imageUri,
      uploaded: false,
      createdAt: new Date().toISOString()
    };

    // Try to upload to Cloudinary if online and enabled
    if (isOnline && CLOUDINARY_ENABLED) {
      const uploadResult = await this.uploadToCloudinary(imageUri, pedidoId);
      
      if (uploadResult.success && uploadResult.url) {
        imageRef.cloudinaryUrl = uploadResult.url;
        imageRef.uploaded = true;
        console.log('✅ Image reference saved with Cloudinary URL');
      } else {
        console.log('⚠️ Cloudinary upload failed, keeping local only');
      }
    } else {
      // Offline or Cloudinary disabled - save to pending uploads
      await this.addToPendingUploads(pedidoId, imageUri);
      console.log('📱 Offline mode: Image saved locally, will sync later');
    }

    // Save reference
    await this.saveImageReferenceToStorage(imageRef);

    // Persist Cloudinary URL en Firebase para otros dispositivos
    try {
      if (imageRef.uploaded && imageRef.cloudinaryUrl) {
        await FirebaseSync.savePedidoImageRef(pedidoId, imageRef.cloudinaryUrl);
      }
    } catch (e) {
      console.warn('⚠️ No se pudo guardar URL de Cloudinary en Firebase:', e);
    }
    return imageRef;
  }

  // Get image URL (Cloudinary first, local fallback)
  static async getImageUrl(pedidoId: number): Promise<string | null> {
    const imageRef = await this.getImageReference(pedidoId);
    
    if (!imageRef) {
      // Intentar obtener URL compartida desde Firebase
      try {
        const remoteUrl = await FirebaseSync.getPedidoImageRef(pedidoId);
        return remoteUrl || null;
      } catch {
        return null;
      }
    }

    // Prefer Cloudinary URL if available
    if (imageRef.cloudinaryUrl) {
      return imageRef.cloudinaryUrl;
    }

    // Fallback: si no hay Cloudinary en referencia local, intentar desde Firebase
    try {
      const remoteUrl = await FirebaseSync.getPedidoImageRef(pedidoId);
      if (remoteUrl) return remoteUrl;
    } catch {}
    // Último recurso: ruta local
    return imageRef.localPath || null;
  }

  // Get image reference
  static async getImageReference(pedidoId: number): Promise<ImageReference | null> {
    try {
      const references = await this.getAllImageReferences();
      return references.find(ref => ref.pedidoId === pedidoId) || null;
    } catch (error) {
      console.error('❌ Error getting image reference:', error);
      return null;
    }
  }

  // Get all image references
  static async getAllImageReferences(): Promise<ImageReference[]> {
    try {
      console.log('📷 Getting all image references...');
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const references = stored ? JSON.parse(stored) : [];
      console.log(`📷 Found ${references.length} image references`);
      return references;
    } catch (error) {
      console.error('❌ Error getting image references:', error);
      return [];
    }
  }

  // Save image reference to storage
  private static async saveImageReferenceToStorage(imageRef: ImageReference): Promise<void> {
    try {
      const references = await this.getAllImageReferences();
      const existingIndex = references.findIndex(ref => ref.pedidoId === imageRef.pedidoId);

      if (existingIndex >= 0) {
        references[existingIndex] = imageRef;
      } else {
        references.push(imageRef);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(references));
    } catch (error) {
      console.error('❌ Error saving image reference:', error);
    }
  }

  // Add to pending uploads (for offline sync)
  private static async addToPendingUploads(pedidoId: number, imageUri: string): Promise<void> {
    try {
      const pending = await this.getPendingUploads();
      pending.push({ pedidoId, imageUri, timestamp: Date.now() });
      await AsyncStorage.setItem(this.PENDING_UPLOADS_KEY, JSON.stringify(pending));
    } catch (error) {
      console.error('❌ Error adding to pending uploads:', error);
    }
  }

  // Get pending uploads
  static async getPendingUploads(): Promise<Array<{pedidoId: number, imageUri: string, timestamp: number}>> {
    try {
      console.log('📤 Getting pending uploads...');
      const stored = await AsyncStorage.getItem(this.PENDING_UPLOADS_KEY);
      const pending = stored ? JSON.parse(stored) : [];
      console.log(`📤 Found ${pending.length} pending uploads`);
      return pending;
    } catch (error) {
      console.error('❌ Error getting pending uploads:', error);
      return [];
    }
  }

  // Sync pending uploads (called when connection is restored)
  static async syncPendingUploads(): Promise<void> {
    if (!CLOUDINARY_ENABLED) {
      console.log('📷 Cloudinary disabled, skipping pending uploads sync');
      return;
    }

    const networkManager = NetworkManager.getInstance();
    if (!networkManager.isOnlineStatus()) {
      console.log('📱 No internet connection, skipping pending uploads sync');
      return;
    }

    try {
      console.log('🔄 Syncing pending image uploads...');
      const pending = await this.getPendingUploads();
      
      if (pending.length === 0) {
        console.log('✅ No pending uploads to sync');
        return;
      }

      console.log(`📤 Found ${pending.length} pending uploads`);

      for (const upload of pending) {
        try {
          const result = await this.uploadToCloudinary(upload.imageUri, upload.pedidoId);
          
          if (result.success && result.url) {
            // Update image reference with Cloudinary URL
            const imageRef = await this.getImageReference(upload.pedidoId);
            if (imageRef) {
              imageRef.cloudinaryUrl = result.url;
              imageRef.uploaded = true;
              await this.saveImageReferenceToStorage(imageRef);
            }
            
            console.log(`✅ Synced image for pedido ${upload.pedidoId}`);
          }
        } catch (error) {
          console.error(`❌ Failed to sync image for pedido ${upload.pedidoId}:`, error);
        }
      }

      // Clear pending uploads after successful sync
      await AsyncStorage.removeItem(this.PENDING_UPLOADS_KEY);
      console.log('✅ Pending uploads sync completed');

    } catch (error) {
      console.error('❌ Error syncing pending uploads:', error);
    }
  }

  // Delete image from Cloudinary
  static async deleteFromCloudinary(cloudinaryUrl: string): Promise<boolean> {
    if (!CLOUDINARY_ENABLED) {
      console.log('📷 Cloudinary disabled, skipping image deletion');
      return true;
    }

    try {
      console.log('🗑️ Deleting image from Cloudinary:', cloudinaryUrl);
      
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/public_id.ext
      const urlParts = cloudinaryUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
        console.error('❌ Invalid Cloudinary URL format:', cloudinaryUrl);
        return false;
      }
      
      // Get the public_id (everything after the version number)
      const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
      const publicId = publicIdWithExt.split('.')[0]; // Remove file extension
      
      console.log('🔍 Extracted public_id:', publicId);
      
      // Generate timestamp for signature
      const timestamp = Math.round(new Date().getTime() / 1000);
      
      // Create signature for Cloudinary Admin API
      // Signature format: sha1(timestamp + api_secret)
      const signatureString = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.apiSecret}`;
      
      // Use crypto-js for cross-platform compatibility (Web + React Native)
      const CryptoJS = require('crypto-js');
      const signature = CryptoJS.SHA1(signatureString).toString();
      
      console.log('🔍 Generated signature for deletion');
      
      // Delete from Cloudinary using Admin API
      const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`;
      
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', cloudinaryConfig.apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      
      const response = await fetch(deleteUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cloudinary deletion failed:', errorText);
        return false;
      }
      
      const result = await response.json();
      console.log('✅ Image deleted from Cloudinary:', result);
      return result.result === 'ok';
      
    } catch (error) {
      console.error('❌ Error deleting image from Cloudinary:', error);
      return false;
    }
  }

  // Delete image reference and optionally from Cloudinary
  static async deleteImageReference(pedidoId: number, deleteFromCloud: boolean = true): Promise<void> {
    try {
      const references = await this.getAllImageReferences();
      const imageRef = references.find(ref => ref.pedidoId === pedidoId);
      
      if (imageRef) {
        // Delete from Cloudinary if requested and URL exists
        if (deleteFromCloud && imageRef.cloudinaryUrl) {
          console.log('🗑️ Deleting image from Cloudinary for pedido:', pedidoId);
          const deleted = await this.deleteFromCloudinary(imageRef.cloudinaryUrl);
          if (!deleted) {
            console.warn('⚠️ Failed to delete image from Cloudinary, but continuing with local cleanup');
          }
        }
        
        // Remove from references
        const filtered = references.filter(ref => ref.pedidoId !== pedidoId);
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
        
        // Also remove from pending uploads
        const pending = await this.getPendingUploads();
        const filteredPending = pending.filter(upload => upload.pedidoId !== pedidoId);
        await AsyncStorage.setItem(this.PENDING_UPLOADS_KEY, JSON.stringify(filteredPending));
        
        console.log(`🗑️ Image reference deleted for pedido ${pedidoId}`);
      }
    } catch (error) {
      console.error('❌ Error deleting image reference:', error);
      throw error;
    }
  }

  // Get sync status
  static async getSyncStatus(): Promise<{
    totalImages: number;
    uploadedImages: number;
    pendingUploads: number;
    localOnlyImages: number;
  }> {
    try {
      console.log('📊 Getting image sync status...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout getting sync status')), 5000);
      });
      
      const getStatusPromise = async () => {
        const references = await this.getAllImageReferences();
        const pending = await this.getPendingUploads();
        
        const uploadedImages = references.filter(ref => ref.uploaded).length;
        const localOnlyImages = references.filter(ref => !ref.uploaded).length;
        
        console.log(`📊 Sync status: ${references.length} total, ${uploadedImages} uploaded, ${pending.length} pending`);
        
        return {
          totalImages: references.length,
          uploadedImages,
          pendingUploads: pending.length,
          localOnlyImages
        };
      };
      
      return await Promise.race([getStatusPromise(), timeoutPromise]);
    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      // Return default values if there's an error
      return {
        totalImages: 0,
        uploadedImages: 0,
        pendingUploads: 0,
        localOnlyImages: 0
      };
    }
  }
}

export default HybridImageService;
