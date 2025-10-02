import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
// import { CameraView } from 'expo-camera';
// import * as ImagePicker from 'expo-image-picker';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface OcrResult {
  confidence: number;
  text: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export default function InvoiceScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(true); // Mock permission granted
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResults, setOcrResults] = useState<OcrResult[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');

  // const cameraRef = useRef<CameraView>(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    // Mock camera permission check
    setHasPermission(true);
  }, []);

  const startRealTimeOcr = async () => {
    setIsScanning(true);
    setOcrResults([]);

    // Simulate real-time OCR processing
    // In a real implementation, this would use ML Kit or similar
    const mockOcrInterval = setInterval(() => {
      const mockResults: OcrResult[] = [
        {
          confidence: 0.85 + Math.random() * 0.1,
          text: 'FAKTURA VAT',
          boundingBox: {
            x: Math.random() * (width * 0.6),
            y: height * 0.2 + Math.random() * 100,
            width: 150,
            height: 30,
          },
        },
        {
          confidence: 0.75 + Math.random() * 0.15,
          text: 'Nr faktury: FV/2024/001',
          boundingBox: {
            x: Math.random() * (width * 0.6),
            y: height * 0.3 + Math.random() * 100,
            width: 200,
            height: 25,
          },
        },
      ];

      setOcrResults(mockResults);
    }, 1000);

    // Stop after 10 seconds for demo
    setTimeout(() => {
      clearInterval(mockOcrInterval);
      setIsScanning(false);
    }, 10000);
  };

  const stopRealTimeOcr = () => {
    setIsScanning(false);
    setOcrResults([]);
  };

  const captureImage = async () => {
    try {
      setIsProcessing(true);

      // Mock image capture
      setTimeout(() => {
        setCapturedImage('mock-image-uri');
        setIsProcessing(false);

        // Show confirmation dialog
        Alert.alert(
          'Image Captured',
          'Do you want to process this invoice?',
          [
            {
              text: 'Retake',
              style: 'cancel',
              onPress: () => setCapturedImage(null),
            },
            {
              text: 'Process',
              onPress: () => processCapturedImage('mock-image-uri'),
            },
          ]
        );
      }, 1000);
    } catch (error) {
      console.error('Error capturing image:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const processCapturedImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);

      // Convert image to base64 for backend processing
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(blob);
      });

      // TODO: Send to backend OCR/LLM service
      console.log('Processing image with backend...');

      // For demo, show mock processing result
      setTimeout(() => {
        setIsProcessing(false);
        (navigation as any).navigate('InvoicePreview', {
          imageUri,
          ocrResult: {
            invoiceNumber: 'FV/2024/001',
            confidence: 0.85,
            seller: { name: 'Mock Seller' },
            grossAmount: 1234.56,
          },
        } as never);
      }, 2000);

    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process invoice');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      // Mock gallery picker
      Alert.alert(
        'Gallery',
        'In a real implementation, this would open the image gallery',
        [
          {
            text: 'Mock Select Image',
            onPress: () => {
              setCapturedImage('mock-gallery-image');
              processCapturedImage('mock-gallery-image');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'on' : flashMode === 'on' ? 'auto' : 'off');
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>Camera access denied</Text>
        <TouchableOpacity style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scan Invoice</Text>

        <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
          <Text style={styles.headerButtonText}>
            {flashMode === 'off' ? 'Flash Off' : flashMode === 'on' ? 'Flash On' : 'Flash Auto'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {/* Mock Camera View - Replace with actual CameraView when expo-camera is installed */}
        <View style={styles.camera}>
          {/* Scanning Frame Overlay */}
          <View style={styles.scanningOverlay}>
            <View style={styles.scanningFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            {/* OCR Results Overlay */}
            {ocrResults.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.ocrResult,
                  {
                    left: result.boundingBox?.x || 0,
                    top: result.boundingBox?.y || 0,
                    width: result.boundingBox?.width || 100,
                    height: result.boundingBox?.height || 30,
                  },
                ]}
              >
                <Text style={styles.ocrText}>{result.text}</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${result.confidence * 100}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Scanning Status */}
          {isScanning && (
            <View style={styles.scanningStatus}>
              <ActivityIndicator size="small" color="#00FF00" />
              <Text style={styles.scanningStatusText}>Scanning...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Gallery Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={pickImageFromGallery}
        >
          <Text style={styles.controlButtonText}>Gallery</Text>
        </TouchableOpacity>

        {/* Capture Button */}
        <TouchableOpacity
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
          onPress={captureImage}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        {/* OCR Toggle Button */}
        <TouchableOpacity
          style={[styles.controlButton, isScanning && styles.controlButtonActive]}
          onPress={isScanning ? stopRealTimeOcr : startRealTimeOcr}
        >
          <Text style={[styles.controlButtonText, isScanning && styles.controlButtonTextActive]}>
            {isScanning ? 'Stop OCR' : 'Start OCR'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>Processing invoice...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanningOverlay: {
    flex: 1,
    position: 'relative',
  },
  scanningFrame: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 10,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00FF00',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  ocrResult: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    borderRadius: 4,
    padding: 4,
    minWidth: 100,
  },
  ocrText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  confidenceBar: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 2,
    marginTop: 2,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 2,
  },
  scanningStatus: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanningStatusText: {
    color: '#00FF00',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  controlButtonActive: {
    backgroundColor: '#00FF00',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controlButtonTextActive: {
    color: '#000000',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  captureButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  permissionButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});