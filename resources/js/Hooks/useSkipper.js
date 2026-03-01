import React from 'react';

function useSkipper() {
  const shouldSkipRef = React.useRef(true);
  const shouldSkip = shouldSkipRef.current;

  // tanStack Table
  // Wrap a function with this to skip a pagination reset temporarily
  // what for:
  // tanstack table by default resets pagination when data changes
  // but in some cases we don't want that to happen
  const skip = React.useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  React.useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip];
}

export default useSkipper;