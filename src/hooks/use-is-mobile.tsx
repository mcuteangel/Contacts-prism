import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isTablet, setIsTablet] = React.useState<boolean>(false)

  React.useEffect(() => {
    const checkDeviceSize = () => {
      const width = window.innerWidth
      setIsMobile(width < MOBILE_BREAKPOINT)
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }
    
    // Check initially
    checkDeviceSize()
    
    // Add event listener
    window.addEventListener('resize', checkDeviceSize)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkDeviceSize)
  }, [])

  return { isMobile, isTablet }
}