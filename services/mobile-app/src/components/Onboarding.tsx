import React, { useState, useEffect } from 'react';
import { Camera, ShieldAlert, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';

interface OnboardingProps {
  onOnboardingComplete: (status: boolean) => void;
  onNavigateToDashboard: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onOnboardingComplete,
  onNavigateToDashboard,
}) => {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'analyzing' | 'success' | 'failed'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [feedback, setFeedback] = useState('Position your face inside the frame');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanState === 'scanning') {
      interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setScanState('analyzing');
            return 100;
          }
          const next = prev + 8;
          if (next > 40 && next < 70) {
            setFeedback('Hold still... scanning facial vectors');
          } else if (next >= 70) {
            setFeedback('Matching with ID document');
          }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [scanState]);

  useEffect(() => {
    if (scanState === 'analyzing') {
      setFeedback('Verifying cryptographic signature...');
      const timer = setTimeout(() => {
        setScanState('success');
        setFeedback('Identity Verified Successfully!');
        onOnboardingComplete(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return;
  }, [scanState, onOnboardingComplete]);

  const handleStartScan = () => {
    setScanProgress(0);
    setScanState('scanning');
    setFeedback('Center your face and look directly at the camera');
  };

  const handleReset = () => {
    setScanState('idle');
    setScanProgress(0);
    setFeedback('Position your face inside the frame');
  };

  return (
    <div className="flex flex-col h-full bg-charcoal-dark text-white select-none">
      {/* Top bar */}
      <div className="flex justify-between items-center p-4 border-b border-charcoal-light/30">
        <span className="text-xs text-slate-400 font-medium">Step 2 of 3: Biometric KYC</span>
        <button 
          onClick={onNavigateToDashboard}
          className="text-xs text-gold font-bold hover:underline"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Biometric Verification</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            To unlock the WDR Deposit Waiver and Trust Alpha scoring, complete a quick secure face scan.
          </p>
        </div>

        {/* Scanner Visualization */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer animated scanning circle */}
            <div 
              className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                scanState === 'scanning' ? 'border-gold border-t-transparent animate-spin' :
                scanState === 'analyzing' ? 'border-gold border-dashed animate-pulse' :
                scanState === 'success' ? 'border-emerald' :
                scanState === 'failed' ? 'border-red-500' :
                'border-charcoal-light/40'
              }`}
            />

            {/* Inner frame */}
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-charcoal bg-charcoal-dark/80 relative flex items-center justify-center shadow-inner">
              {/* Camera Simulator background */}
              {scanState === 'idle' && (
                <div className="text-center p-4 flex flex-col items-center">
                  <Camera className="w-12 h-12 text-slate-500 mb-2" />
                  <span className="text-xs text-slate-500 font-medium">Camera Offline</span>
                </div>
              )}

              {scanState === 'scanning' && (
                <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center">
                  {/* Grid lines to simulate scanner */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div 
                    className="absolute left-0 w-full h-1 bg-gold shadow-glow animate-scan"
                    style={{ top: `${scanProgress}%` }}
                  />
                  <div className="w-32 h-32 rounded-full border border-gold/30 flex items-center justify-center animate-pulse">
                    <UserCheck className="w-12 h-12 text-gold/60" />
                  </div>
                </div>
              )}

              {scanState === 'analyzing' && (
                <div className="absolute inset-0 bg-charcoal flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-gold animate-spin" />
                  <span className="text-xs text-gold font-bold uppercase tracking-widest animate-pulse">Analyzing</span>
                </div>
              )}

              {scanState === 'success' && (
                <div className="absolute inset-0 bg-emerald/10 flex flex-col items-center justify-center space-y-2">
                  <CheckCircle2 className="w-16 h-16 text-emerald animate-scale-up" />
                  <span className="text-sm font-bold text-emerald">Matched 99.8%</span>
                </div>
              )}
            </div>

            {/* Scanning Percentage Badge */}
            {scanState === 'scanning' && (
              <div className="absolute bottom-2 bg-gold text-charcoal-dark text-xs font-bold px-3 py-1 rounded-full shadow-glow">
                {scanProgress}%
              </div>
            )}
          </div>

          {/* Feedback Instructions */}
          <div className="mt-6 text-center">
            <p className={`text-sm font-medium ${
              scanState === 'success' ? 'text-emerald' : 
              scanState === 'failed' ? 'text-red-400' : 
              'text-slate-300'
            }`}>
              {feedback}
            </p>
            {scanState === 'scanning' && (
              <p className="text-[11px] text-slate-500 mt-1">Keep your face well-lit and remove any sunglasses</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          {scanState === 'idle' && (
            <button
              onClick={handleStartScan}
              className="w-full bg-gold hover:bg-gold-dark text-charcoal-dark font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-glow flex items-center justify-center space-x-2"
            >
              <span>Begin Face Scan</span>
            </button>
          )}

          {(scanState === 'scanning' || scanState === 'analyzing') && (
            <button
              disabled
              className="w-full bg-charcoal border border-charcoal-light/30 text-slate-500 font-bold py-3.5 px-4 rounded-xl cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>Scanning in Progress...</span>
            </button>
          )}

          {scanState === 'success' && (
            <button
              onClick={onNavigateToDashboard}
              className="w-full bg-emerald hover:bg-emerald-dark text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Go to Trust Dashboard</span>
            </button>
          )}

          {scanState === 'failed' && (
            <button
              onClick={handleReset}
              className="w-full bg-charcoal border border-charcoal-light text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Try Again</span>
            </button>
          )}

          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>POPIA & FICA Compliant • Secure 256-bit Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};
