'use client';

import clsx from 'clsx';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  className?: string;
}

interface CameraDevice {
  id: string;
  label: string;
}

// Dynamic import type for html5-qrcode
type Html5QrcodeType = any;

export function QRScanner({ onScan, onError, onClose, className }: QRScannerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerId = 'qr-scanner-container';

  // Detect if mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    // Mark component as ready after mount
    setIsReady(true);
    
    return () => {};
  }, []);

  // Get available cameras
  const getCameras = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Prefer back camera on mobile
        const backCamera = devices.find((d: CameraDevice) => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(backCamera?.id || devices[0].id);
        setHasPermission(true);
        return true;
      } else {
        setError('No cameras found on this device');
        setHasPermission(false);
        return false;
      }
    } catch (err: any) {
      console.error('Error getting cameras:', err);
      if (err.message?.includes('Permission denied') || err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
        setHasPermission(false);
      } else {
        setError('Failed to access camera. Please check your device settings.');
      }
      return false;
    }
  }, []);

  // Initialize camera list on mount
  useEffect(() => {
    if (isReady) {
      getCameras();
    }
  }, [getCameras, isReady]);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!isReady) return;
    
    if (!selectedCamera) {
      const success = await getCameras();
      if (!success) return;
    }

    setError('');
    setIsScanning(true);

    try {
      // Clean up any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
        scannerRef.current = null;
      }

      // Dynamic import to avoid SSR issues
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      
      // Make sure DOM element exists
      const element = document.getElementById(scannerId);
      if (!element) {
        throw new Error('Scanner container not found');
      }

      // Create new scanner instance
      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: isMobile ? { width: 250, height: 250 } : { width: 300, height: 300 },
        aspectRatio: isMobile ? 1.0 : 1.5,
        disableFlip: false,
      };

      await scanner.start(
        selectedCamera,
        config,
        (decodedText: string) => {
          // Prevent duplicate scans
          if (decodedText !== lastScanned) {
            setLastScanned(decodedText);
            console.log('QR Code scanned:', decodedText);
            
            // Vibrate on mobile if supported
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            
            onScan(decodedText);
          }
        },
        (errorMessage: string) => {
          // Ignore "QR code not found" errors - they happen constantly when scanning
          if (!errorMessage.includes('No QR code found')) {
            console.debug('QR scan error:', errorMessage);
          }
        }
      );

    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setIsScanning(false);
      
      if (err.message?.includes('Permission denied') || err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
        setHasPermission(false);
      } else if (err.message?.includes('already in use')) {
        setError('Camera is already in use by another application.');
      } else {
        setError(`Failed to start camera: ${err.message || 'Unknown error'}`);
      }
      onError?.(err.message || 'Failed to start scanner');
    }
  }, [selectedCamera, isMobile, lastScanned, onScan, onError, getCameras, isReady]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.debug('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setLastScanned('');
  }, []);

  // Toggle torch (flashlight) - only works on some mobile devices
  const toggleTorch = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        const capabilities = await (scannerRef.current as any).getRunningTrackCapabilities();
        if (capabilities?.torch) {
          await (scannerRef.current as any).applyVideoConstraints({
            advanced: [{ torch: !torchEnabled }]
          });
          setTorchEnabled(!torchEnabled);
        } else {
          setError('Flashlight not available on this device');
        }
      } catch (e) {
        console.error('Torch toggle error:', e);
        setError('Failed to toggle flashlight');
      }
    }
  }, [isScanning, torchEnabled]);

  // Switch camera
  const switchCamera = useCallback(async (cameraId: string) => {
    setSelectedCamera(cameraId);
    if (isScanning) {
      await stopScanning();
      // Small delay before restarting with new camera
      setTimeout(() => startScanning(), 100);
    }
  }, [isScanning, stopScanning, startScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Request camera permission
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      await getCameras();
    } catch (err: any) {
      console.error('Permission request failed:', err);
      setError('Camera permission denied. Please enable it in your browser settings.');
      setHasPermission(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={clsx(
        'relative rounded-2xl overflow-hidden',
        isDark ? 'bg-night-nav border border-white/10' : 'bg-white border border-gray-200',
        className
      )}
    >
      {/* Header */}
      <div className={clsx(
        'flex items-center justify-between p-4 border-b',
        isDark ? 'border-white/10' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isDark ? 'bg-green-500/20' : 'bg-green-100'
          )}>
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m10 0h.01M4 20h2m10 0a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </div>
          <div>
            <h3 className={clsx(
              'font-semibold',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              QR Code Scanner
            </h3>
            <p className={clsx(
              'text-sm',
              isDark ? 'text-night-muted' : 'text-gray-500'
            )}>
              {isMobile ? 'Point your camera at the QR code' : 'Use your webcam to scan'}
            </p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              isDark 
                ? 'hover:bg-white/10 text-night-muted hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Scanner Area */}
      <div className="relative">
        {/* Video Container */}
        <div 
          id={scannerId}
          className={clsx(
            'w-full min-h-[300px] md:min-h-[400px]',
            !isScanning && 'flex items-center justify-center',
            isDark ? 'bg-night-bg' : 'bg-gray-100'
          )}
        >
          {!isScanning && hasPermission !== false && (
            <div className="text-center p-8">
              <div className={clsx(
                'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4',
                isDark ? 'bg-white/5' : 'bg-gray-200'
              )}>
                <svg className={clsx('w-10 h-10', isDark ? 'text-night-muted' : 'text-gray-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className={clsx(
                'text-sm mb-2',
                isDark ? 'text-night-muted' : 'text-gray-500'
              )}>
                Camera ready
              </p>
              <p className={clsx(
                'text-xs',
                isDark ? 'text-night-muted/70' : 'text-gray-400'
              )}>
                Click "Start Scanning" to begin
              </p>
            </div>
          )}

          {/* Permission Denied State */}
          {hasPermission === false && (
            <div className="text-center p-8">
              <div className={clsx(
                'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4',
                isDark ? 'bg-red-500/20' : 'bg-red-100'
              )}>
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <p className={clsx(
                'text-sm mb-4',
                isDark ? 'text-night-muted' : 'text-gray-500'
              )}>
                Camera access required
              </p>
              <button
                onClick={requestPermission}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  'bg-green-500 hover:bg-green-600 text-white'
                )}
              >
                Grant Permission
              </button>
            </div>
          )}
        </div>

        {/* Scanning Overlay with Corner Markers */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64 md:w-72 md:h-72">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
                
                {/* Scanning line animation */}
                <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scan" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={clsx(
          'mx-4 my-3 p-3 rounded-lg text-sm',
          isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
        )}>
          {error}
        </div>
      )}

      {/* Controls */}
      <div className={clsx(
        'p-4 border-t',
        isDark ? 'border-white/10' : 'border-gray-200'
      )}>
        {/* Camera Selection */}
        {cameras.length > 1 && (
          <div className="mb-4">
            <label className={clsx(
              'block text-sm font-medium mb-2',
              isDark ? 'text-night-muted' : 'text-gray-600'
            )}>
              Select Camera
            </label>
            <select
              value={selectedCamera}
              onChange={(e) => switchCamera(e.target.value)}
              disabled={isScanning}
              className={clsx(
                'w-full px-3 py-2 rounded-lg text-sm transition-colors',
                isDark 
                  ? 'bg-white/5 border border-white/10 text-white disabled:opacity-50' 
                  : 'bg-gray-50 border border-gray-200 text-gray-900 disabled:opacity-50'
              )}
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isScanning ? (
            <button
              onClick={startScanning}
              disabled={hasPermission === false}
              className={clsx(
                'flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all',
                'flex items-center justify-center gap-2',
                'bg-green-500 hover:bg-green-600 text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Scanning
            </button>
          ) : (
            <>
              <button
                onClick={stopScanning}
                className={clsx(
                  'flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all',
                  'flex items-center justify-center gap-2',
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop
              </button>
              
              {/* Torch button - only show on mobile */}
              {isMobile && (
                <button
                  onClick={toggleTorch}
                  className={clsx(
                    'py-3 px-4 rounded-xl font-medium text-sm transition-all',
                    'flex items-center justify-center',
                    torchEnabled
                      ? 'bg-yellow-500 text-white'
                      : isDark 
                        ? 'bg-white/10 hover:bg-white/20 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  )}
                >
                  <svg className="w-5 h-5" fill={torchEnabled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* Tip */}
        <p className={clsx(
          'mt-4 text-xs text-center',
          isDark ? 'text-night-muted/70' : 'text-gray-400'
        )}>
          {isMobile 
            ? 'Hold your device steady and center the QR code in the frame' 
            : 'Position the QR code within the scanning area'
          }
        </p>
      </div>
    </div>
  );
}
