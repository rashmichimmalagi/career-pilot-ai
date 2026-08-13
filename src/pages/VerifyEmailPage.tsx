import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Compass, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface VerifyEmailPageProps {
  onNavigate: (page: string) => void;
  emailOverride?: string;
  noticeMessage?: string;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  onNavigate,
  emailOverride,
  noticeMessage
}) => {
  const { user, resendVerificationEmail, signOut, clearError } = useAuth();

  const targetEmail = emailOverride || user?.email || 'your email address';

  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    if (!targetEmail || targetEmail === 'your email address') {
      setErrorMessage('No email address found. Please try signing in again.');
      return;
    }

    clearError();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      await resendVerificationEmail(targetEmail);
      setSuccessMessage('Verification email sent. Please check your inbox.');
      setCooldown(60); // 60-second cooldown to prevent spam & rate limiting
    } catch (err: any) {
      console.error('Error resending email:', err);
      const rawMsg = err?.message || '';
      if (rawMsg.toLowerCase().includes('rate limit')) {
        setErrorMessage('Too many requests. Please wait a minute before requesting another verification email.');
        setCooldown(60);
      } else {
        setErrorMessage(rawMsg || 'Failed to resend verification email. Please try again later.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignIn = async () => {
    try {
      await signOut();
    } catch (e) {
      // Ignore signout error
    }
    onNavigate('auth');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-indigo-500/15 dark:bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Verification Card */}
      <div className="w-full max-w-md bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl relative z-10 space-y-6 transition-colors duration-300">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-inner">
            <Mail className="w-8 h-8 animate-bounce-slow" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Verify your email 📧
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            We've sent a verification link to:
          </p>

          <div className="py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-slate-950 border border-indigo-200 dark:border-slate-800 text-indigo-900 dark:text-indigo-300 font-mono text-xs sm:text-sm font-semibold truncate">
            {targetEmail}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            Please check your inbox and click the verification link to activate your CareerPilot account.
          </p>
        </div>

        {/* Notice Message if redirected from protected route */}
        {noticeMessage && !errorMessage && !successMessage && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold">{noticeMessage}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">Email Sent</p>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-800 dark:text-rose-200">Verification Alert</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Sending Verification Email...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Resend in {cooldown}s</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>

          {/* Back to Sign In Button */}
          <button
            onClick={handleBackToSignIn}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-2">
          Didn't receive the email? Check your spam/junk folder or click resend above.
        </p>

      </div>
    </div>
  );
};
