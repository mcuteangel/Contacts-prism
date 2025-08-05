// ===== IMPORTS & DEPENDENCIES =====
import * as React from "react"

// ===== CONFIGURATION & CONSTANTS =====
const MOBILE_BREAKPOINT = 768;

// ===== CORE BUSINESS LOGIC (CUSTOM HOOK) =====
/**
 * A custom React hook to determine if the current viewport is a mobile device.
 * It initializes to a non-mobile state to prevent layout shifts during server-side rendering
 * and hydration, then updates to the correct state on the client.
 *
 * @returns {boolean} `true` if the viewport width is less than the mobile breakpoint, otherwise `false`.
 */
export function useIsMobile() {
  // Initialize with `false` to ensure a consistent render on the server and prevent layout shifts.
  // The effect will correct this value on the client-side after the initial render.
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // This function checks the window width and updates the state.
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Run the check once on component mount in the client.
    checkIsMobile();
    
    // Add a resize event listener to update the state when the window size changes.
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup function to remove the event listener when the component unmounts.
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  return isMobile;
}