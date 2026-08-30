/**
 * Inactivity Service
 * Tracks user activity, throttles event handling, and provides cross-tab synchronization.
 */

export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes = 600,000 ms
export const WARNING_BEFORE_TIMEOUT_MS = 1 * 60 * 1000; // 1 minute = 60,000 ms
export const WARNING_THRESHOLD_MS = INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS; // 9 minutes = 540,000 ms
export const THROTTLE_MS = 1000; // Throttle activity updates to at most once per second

const STORAGE_KEY = 'careerpilot_last_active_timestamp';
const BROADCAST_CHANNEL_NAME = 'careerpilot_inactivity_channel';

class InactivityService {
  private lastActiveTimestamp: number = Date.now();
  private lastThrottledRecord: number = 0;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Initialize timestamp from storage if available and recent
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > 0) {
            this.lastActiveTimestamp = parsed;
          }
        }
      } catch {
        // LocalStorage might be restricted
      }

      // Initialize BroadcastChannel if supported
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data?.type === 'ACTIVITY_HEARTBEAT' && typeof event.data.timestamp === 'number') {
              this.syncTimestampFromRemote(event.data.timestamp);
            }
          };
        } catch {
          this.channel = null;
        }
      }

      // Listen to storage events for cross-tab sync fallback
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          const parsed = parseInt(e.newValue, 10);
          if (!isNaN(parsed) && parsed > 0) {
            this.syncTimestampFromRemote(parsed);
          }
        }
      });
    }
  }

  /**
   * Sync timestamp received from another browser tab
   */
  private syncTimestampFromRemote(remoteTimestamp: number) {
    if (remoteTimestamp > this.lastActiveTimestamp) {
      this.lastActiveTimestamp = remoteTimestamp;
      this.notifyListeners();
    }
  }

  /**
   * Record meaningful user activity (throttled)
   */
  public recordActivity(force = false) {
    const now = Date.now();
    if (!force && now - this.lastThrottledRecord < THROTTLE_MS) {
      return;
    }

    this.lastThrottledRecord = now;
    this.lastActiveTimestamp = now;

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, now.toString());
      }
    } catch {
      // Storage unavailable or quota exceeded
    }

    // Broadcast to other tabs
    try {
      if (this.channel) {
        this.channel.postMessage({
          type: 'ACTIVITY_HEARTBEAT',
          timestamp: now,
        });
      }
    } catch {
      // Ignore broadcast errors
    }

    this.notifyListeners();
  }

  /**
   * Get the most up-to-date last active timestamp
   */
  public getLastActiveTimestamp(): number {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > this.lastActiveTimestamp) {
            this.lastActiveTimestamp = parsed;
          }
        }
      }
    } catch {
      // Fallback to in-memory timestamp
    }
    return this.lastActiveTimestamp;
  }

  /**
   * Get duration (in ms) since last user activity
   */
  public getInactiveDuration(): number {
    const now = Date.now();
    const lastActive = this.getLastActiveTimestamp();
    return Math.max(0, now - lastActive);
  }

  /**
   * Reset activity timer explicitly (e.g. when user clicks 'Stay Logged In')
   */
  public resetTimer() {
    this.recordActivity(true);
  }

  /**
   * Clear stored timestamp upon logout
   */
  public clearTimer() {
    this.lastActiveTimestamp = Date.now();
    this.lastThrottledRecord = 0;
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Subscribe to timestamp updates
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignore listener errors
      }
    });
  }
}

export const inactivityService = new InactivityService();
