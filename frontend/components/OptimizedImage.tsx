import React, { useState, useCallback } from 'react';
import { View, Image, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useOptimizedImage } from '../hooks/useOptimizedPerformance';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  placeholder?: string;
  errorPlaceholder?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  enableOptimization?: boolean;
  showLoadingIndicator?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  errorPlaceholder,
  resizeMode = 'cover',
  onLoadStart,
  onLoadEnd,
  onError,
  enableOptimization = true,
  showLoadingIndicator = true,
  retryOnError = true,
  maxRetries = 3,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageSource, setImageSource] = useState(source);

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  // Image optimization hook
  const { imageQuality, getImageConfig } = useOptimizedImage();

  // Get optimized image configuration
  const optimizedConfig = enableOptimization ? getImageConfig() : {};

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
    setError(false);

    // Animate image appearance
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withTiming(1, { duration: 300 });

    onLoadEnd?.();
  }, [onLoadEnd, opacity, scale]);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);

    // Retry logic
    if (retryOnError && retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setError(false);
        setLoading(true);
        // Force re-render by updating source
        setImageSource({ ...imageSource });
      }, 1000 * (retryCount + 1)); // Exponential backoff
    }

    onError?.();
  }, [retryOnError, retryCount, maxRetries, onError, imageSource]);

  const handleRetry = useCallback(() => {
    setError(false);
    setLoading(true);
    setRetryCount(0);
    setImageSource({ ...imageSource });
  }, [imageSource]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const renderContent = () => {
    if (error && !retryOnError) {
      return (
        <View style={[styles.errorContainer, style]}>
          <Ionicons
            name="image-outline"
            size={48}
            color="#9E9E9E"
          />
          {errorPlaceholder && (
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (error && retryOnError && retryCount >= maxRetries) {
      return (
        <View style={[styles.errorContainer, style]}>
          <Ionicons
            name="image-outline"
            size={48}
            color="#9E9E9E"
          />
          <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <Animated.Image
          source={typeof imageSource === 'number' ? imageSource : {
            ...imageSource,
            ...optimizedConfig
          }}
          style={[style, animatedStyle]}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          progressiveRenderingEnabled={Platform.OS === 'android'}
          fadeDuration={Platform.OS === 'android' ? 0 : 300} // Android handles fade with animation
        />

        {/* Loading indicator */}
        {loading && showLoadingIndicator && (
          <View style={[styles.loadingContainer, style]}>
            <ActivityIndicator
              size="small"
              color="#007AFF"
              style={styles.loadingIndicator}
            />
            {placeholder && (
              <Ionicons
                name="image-outline"
                size={24}
                color="#9E9E9E"
                style={styles.placeholderIcon}
              />
            )}
          </View>
        )}

        {/* Error with retry */}
        {error && retryOnError && retryCount < maxRetries && (
          <View style={[styles.errorContainer, style]}>
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
              <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  return <View style={style}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingIndicator: {
    position: 'absolute',
  },
  placeholderIcon: {
    opacity: 0.5,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

// Utility function to preload images
export const preloadImage = (source: string | number): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof source === 'number') {
      // Local images are always "preloaded"
      resolve(true);
      return;
    }

    Image.prefetch(source).then(() => {
      resolve(true);
    }).catch(() => {
      resolve(false);
    });
  });
};

// Utility function to get image dimensions
export const getImageDimensions = (source: string | number): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    if (typeof source === 'number') {
      // For local images, we can't get dimensions easily
      resolve({ width: 100, height: 100 });
      return;
    }

    Image.getSize(
      source,
      (width, height) => {
        resolve({ width, height });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export default OptimizedImage;
