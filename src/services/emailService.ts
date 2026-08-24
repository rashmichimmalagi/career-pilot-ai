import { supabase } from '../lib/supabase';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export interface SendEmailResult {
  success: boolean;
  message: string;
  recipient?: string;
  emailId?: string;
  error?: string;
}

/**
 * Safely parse response text as JSON without throwing SyntaxError on HTML/text responses
 */
async function parseJsonResponse(response: Response): Promise<{ ok: boolean; status: number; data: any; rawText: string }> {
  const status = response.status;
  const ok = response.ok;
  let rawText = '';
  try {
    rawText = await response.text();
  } catch {
    rawText = '';
  }

  let data: any = null;
  if (rawText && rawText.trim().startsWith('{')) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  return { ok, status, data, rawText };
}

export const emailService = {
  /**
   * Send a test email to the currently authenticated student.
   * Note: The recipient is securely derived on the server / Edge Function from the authenticated session.
   * No arbitrary recipient emails are accepted from the frontend.
   */
  async sendTestEmail(): Promise<SendEmailResult> {
    try {
      // 1. Force a session refresh to guarantee an active, unexpired JWT
      console.log('[emailService] Refreshing Supabase session before invoking function...');
      let { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      let session = refreshData?.session;

      if (!session || !session.access_token) {
        // Fallback to getSession
        const { data: getSessionData, error: getSessionError } = await supabase.auth.getSession();
        session = getSessionData?.session;
        if (getSessionError || !session || !session.access_token) {
          console.warn('[emailService] No active session found:', refreshError?.message || getSessionError?.message);
          return {
            success: false,
            message: 'Failed to Send Email',
            error: 'Your session has expired. Please sign in again.',
          };
        }
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Safe diagnostics log (NEVER log the actual token)
      console.log('[emailService] Session Diagnostics:', {
        hasSession: Boolean(session),
        hasUser: Boolean(session.user || currentUser),
        userId: session.user?.id || currentUser?.id,
        userEmail: session.user?.email || currentUser?.email,
        hasAccessToken: Boolean(session.access_token),
        tokenExpiresAt: session.expires_at,
        tokenIsExpired: session.expires_at ? session.expires_at <= Math.floor(Date.now() / 1000) : false,
        userMatch: session.user?.id === currentUser?.id,
      });

      const userEmail = session.user?.email || currentUser?.email || '';

      // 2. Invoke Supabase Edge Function 'send-career-email' with user's freshly refreshed authenticated JWT
      console.log('[emailService] Invoking Supabase Edge Function send-career-email with fresh user JWT...');

      try {
        const { data, error } = await supabase.functions.invoke('send-career-email', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: { type: 'test' },
        });

        if (!error && data) {
          if (data.success) {
            return {
              success: true,
              message: 'Email Sent Successfully',
              recipient: data.recipient || userEmail,
              emailId: data.emailId,
            };
          }
          if (data.error) {
            return {
              success: false,
              message: 'Failed to Send Email',
              error: `Function: send-career-email\nError: ${data.error}`,
            };
          }
        }

        if (error) {
          console.warn('[emailService] Supabase SDK invoke error:', error);
          let httpStatus: number | string = 'Unknown';
          let detailMessage = error.message || String(error);
          const errorName = error.name || 'FunctionsError';

          if ('context' in (error as any) && (error as any).context) {
            const contextObj = (error as any).context;
            if (contextObj.status) {
              httpStatus = contextObj.status;
            }
            try {
              const resJson = await contextObj.json();
              if (resJson?.error) {
                detailMessage = typeof resJson.error === 'object' ? JSON.stringify(resJson.error) : resJson.error;
              } else if (resJson?.message) {
                detailMessage = resJson.message;
              }
            } catch {
              try {
                const resText = await contextObj.text();
                if (resText && !resText.startsWith('<!')) {
                  detailMessage = resText;
                }
              } catch {
                // Ignore context read failure
              }
            }
          }

          if (httpStatus === 401) {
            return {
              success: false,
              message: 'Failed to Send Email',
              error: `Function: send-career-email\nStatus: 401\nError: ${errorName}: ${detailMessage}`,
            };
          }

          return {
            success: false,
            message: 'Failed to Send Email',
            error: `Function: send-career-email\nStatus: ${httpStatus}\nError: ${errorName}: ${detailMessage}`,
          };
        }
      } catch (invokeErr: any) {
        console.warn('[emailService] Edge function invocation exception:', invokeErr?.message);
        return {
          success: false,
          message: 'Failed to Send Email',
          error: `Function: send-career-email\nError: ${invokeErr?.message || String(invokeErr)}`,
        };
      }

      // 3. Fallback Route: Express /api/send-career-email (verifies Supabase JWT token & dispatches)
      try {
        console.log('[emailService] Dispatching email via server /api/send-career-email fallback...');
        const response = await fetchWithTimeout('/api/send-career-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          timeoutMs: 10000,
          body: JSON.stringify({ type: 'test' }),
        });

        const { ok, status, data, rawText } = await parseJsonResponse(response);

        if (ok && data && data.success) {
          return {
            success: true,
            message: 'Email Sent Successfully',
            recipient: data.recipient || userEmail,
            emailId: data.emailId,
          };
        }

        if (data && data.error) {
          return {
            success: false,
            message: 'Failed to Send Email',
            error: data.error,
          };
        }

        if (rawText && !rawText.startsWith('<!')) {
          return {
            success: false,
            message: 'Failed to Send Email',
            error: `Server status ${status}: ${rawText}`,
          };
        }
      } catch (serverErr: any) {
        console.warn('[emailService] Server endpoint request warning:', serverErr?.message);
      }

      return {
        success: false,
        message: 'Failed to Send Email',
        error: 'Function: send-career-email\nStatus: 404 / Network\nError: FunctionsFetchError: Failed to send a request to the Edge Function\nNote: Please deploy the Edge Function using "supabase functions deploy send-career-email" or configure RESEND_API_KEY in your server environment.',
      };
    } catch (err: any) {
      console.error('[emailService] Send test email error:', err);
      return {
        success: false,
        message: 'Failed to Send Email',
        error: err?.message && !err.message.includes('<') ? err.message : 'An unexpected error occurred while sending the email.',
      };
    }
  },
};

