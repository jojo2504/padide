'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeSupportedFormats, type Html5QrcodeResult } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: Html5QrcodeResult) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
}

export default function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Scanner already stopped
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileWidth = window.innerWidth < 768;
      setIsMobile(isTouchDevice && isMobileWidth);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize camera scanner for mobile
  const startCameraScanner = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      const html5QrCode = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText, decodedResult) => {
          onScanSuccess(decodedText, decodedResult);
          stopScanner();
        },
        () => {
          // Ignore scanning errors (happens when no QR is in view)
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera';
      setError(errorMessage);
      setIsScanning(false);
      onScanError?.(errorMessage);
    }
  }, [onScanSuccess, onScanError, stopScanner]);

  // Handle file upload for desktop
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      
      const html5QrCode = new Html5Qrcode('qr-file-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      const result = await html5QrCode.scanFile(file, true);
      onScanSuccess(result, { decodedText: result } as Html5QrcodeResult);
      html5QrCode.clear();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('No QR code found in image. Please try another image.');
      onScanError?.(errorMessage);
    }
  }, [onScanSuccess, onScanError]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Spring animation config
  const springConfig = { type: 'spring' as const, stiffness: 300, damping: 25 };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-lg mx-4 overflow-hidden rounded-3xl bg-gradient-to-br from-clay-light to-clay-dark border-4 border-white/20 shadow-clay"
        initial={{ scale: 0.8, y: 50, rotateX: -15 }}
        animate={{ scale: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={springConfig}
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-void font-heading">
            {isMobile ? '📸 Scan QR Code' : '📤 Upload QR Code'}
          </h2>
          <motion.button
            onClick={() => {
              stopScanner();
              onClose?.();
            }}
            className="w-10 h-10 rounded-full bg-rose-400 flex items-center justify-center text-white font-bold shadow-lg"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isMobile ? (
            // Mobile: Camera Scanner
            <div className="space-y-4">
              {!isScanning ? (
                <motion.button
                  onClick={startCameraScanner}
                  className="w-full py-6 rounded-2xl bg-gradient-to-br from-leaf to-leaf-dark text-white font-bold text-xl shadow-lg"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    boxShadow: '0 10px 30px rgba(34, 197, 94, 0.4)',
                  }}
                >
                  <span className="flex items-center justify-center gap-3">
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      📷
                    </motion.span>
                    Open Camera
                  </span>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div 
                    id="qr-reader" 
                    className="w-full rounded-2xl overflow-hidden border-4 border-leaf/30"
                  />
                  <motion.button
                    onClick={stopScanner}
                    className="w-full mt-4 py-4 rounded-xl bg-rose-400 text-white font-bold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Stop Scanning
                  </motion.button>
                </motion.div>
              )}

              {/* Scanning animation */}
              {isScanning && (
                <motion.div
                  className="absolute inset-x-6 top-1/2 h-1 bg-gradient-to-r from-transparent via-leaf to-transparent rounded-full"
                  animate={{ y: [-100, 100] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                />
              )}
            </div>
          ) : (
            // Desktop: File Upload
            <div className="space-y-4">
              <motion.div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative cursor-pointer rounded-2xl border-4 border-dashed p-12
                  transition-colors duration-300
                  ${dragActive 
                    ? 'border-leaf bg-leaf/10' 
                    : 'border-void/20 bg-white/50 hover:border-leaf/50 hover:bg-leaf/5'
                  }
                `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="text-center">
                  <motion.div
                    className="text-6xl mb-4"
                    animate={dragActive ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
                    transition={springConfig}
                  >
                    🖼️
                  </motion.div>
                  <p className="text-xl font-bold text-void mb-2">
                    {dragActive ? 'Drop it like it\'s hot!' : 'Drag & Drop QR Image'}
                  </p>
                  <p className="text-void/60">
                    or click to browse your files
                  </p>
                  <p className="text-sm text-void/40 mt-2">
                    Supports PNG, JPG, GIF
                  </p>
                </div>
              </motion.div>

              {/* Hidden element for file scanning */}
              <div id="qr-file-reader" className="hidden" />
            </div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 rounded-xl bg-rose-100 border-2 border-rose-300 text-rose-600 font-medium"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with tips */}
        <div className="p-6 bg-void/5 border-t border-white/10">
          <p className="text-sm text-void/60 text-center">
            {isMobile 
              ? '💡 Point your camera at a CYCLR product QR code'
              : '💡 Upload a photo of any CYCLR product QR code'
            }
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
