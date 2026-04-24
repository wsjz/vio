// ============ LAYOUT CONSTANTS ============

/** Taskbar height in pixels */
export const TASKBAR_HEIGHT = 36;

/** Minimum window width in pixels */
export const MIN_WINDOW_WIDTH = 320;

/** Minimum window height in pixels */
export const MIN_WINDOW_HEIGHT = 200;

/** Window cascade offset multiplier (px per window) */
export const WINDOW_CASCADE_OFFSET = 30;

/** Default z-index base for windows */
export const Z_INDEX_BASE = 100;

// ============ TIMING CONSTANTS ============

/** Startup screen display duration (ms) */
export const STARTUP_DURATION = 2500;

/** Layout auto-save debounce delay (ms) */
export const LAYOUT_SAVE_DEBOUNCE = 3000;

/** System metrics polling interval (ms) */
export const METRICS_POLL_INTERVAL = 2000;

/** Clock update interval (ms) */
export const CLOCK_UPDATE_INTERVAL = 1000;

// ============ NETWORK SCAN ============

/** Number of IPs to scan per subnet */
export const NETWORK_SCAN_COUNT = 20;

/** Ping timeout in seconds */
export const NETWORK_SCAN_TIMEOUT = 1;

// ============ APP GRID ============

/** AppGrid card width in pixels */
export const APPGRID_CARD_WIDTH = 240;

/** AppGrid card height in pixels */
export const APPGRID_CARD_HEIGHT = 180;

/** AppGrid columns per page */
export const APPGRID_COLS = 3;

/** AppGrid rows per page */
export const APPGRID_ROWS = 2;

/** AppGrid max cards per page */
export const APPGRID_PAGE_SIZE = APPGRID_COLS * APPGRID_ROWS;
