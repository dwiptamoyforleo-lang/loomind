import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, decodeGoogleJwt } from '../utils/userDataStorage';
import { GoogleUserProfile } from '../types';

interface GoogleSignInButtonProps {
  onSuccess: (user: GoogleUserProfile) => void;
  onError?: (err: any) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'small' | 'medium' | 'large';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'continue_with',
  theme = 'outline',
  size = 'large',
  shape = 'pill',
  width,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGisReady, setIsGisReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let checkInterval: any = null;
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds polling

    const initGis = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              if (response && response.credential) {
                const profile = decodeGoogleJwt(response.credential);
                if (profile) {
                  onSuccess(profile);
                } else if (onError) {
                  onError(new Error('Failed to extract user profile from Google credential'));
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(containerRef.current, {
              theme,
              size,
              text,
              shape,
              width: width || 240,
              logo_alignment: 'left',
            });
          }

          setIsGisReady(true);
          if (checkInterval) clearInterval(checkInterval);
        } catch (e: any) {
          console.error('Google Identity Services initialization error:', e);
          setLoadError(e?.message || 'Initialization failed');
        }
      }
    };

    // Try immediately
    if (window.google?.accounts?.id) {
      initGis();
    } else {
      // Poll until script loads
      checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          initGis();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setLoadError('Google Identity Services script did not load.');
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [onSuccess, onError, theme, size, text, shape, width]);

  const handleManualTrigger = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('One-tap dismissed or skipped:', notification.getNotDisplayedReason());
        }
      });
    }
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      {/* Official GIS Button Container */}
      <div ref={containerRef} className="min-h-[40px] flex items-center justify-center" />

      {/* Fallback button if GIS script hasn't rendered yet or for direct click */}
      {!isGisReady && !loadError && (
        <button
          type="button"
          onClick={handleManualTrigger}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs md:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-750 shadow-xs transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      )}

      {loadError && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
          {loadError}
        </p>
      )}
    </div>
  );
};

// Global typing for GIS
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentNotification?: any) => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, done: () => void) => void;
        };
      };
    };
  }
}
