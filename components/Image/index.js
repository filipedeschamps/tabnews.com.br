import React, { useCallback, useRef, useState } from 'react';

import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import { debounce } from '../../utils/debounce';

export default function Image ({ src, alt, width, height, ...rest }) {
  const [isImageInView, setIsImageInView] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const containerRef = useRef();

  const debouncedOnViewportEnter = debounce(() => {
    if (!isImageInView) {
      setIsImageInView(true);
    }
  }, 200);

  const handleOnLoadImage = useCallback(() => {
    if (!isImageLoaded) {
      setIsImageLoaded(true);
    }
  }, [isImageLoaded]);

  useIntersectionObserver({
    ref: containerRef,
    onViewportEnter: debouncedOnViewportEnter,
  });

  return (
    <div ref={containerRef} style={{ width, height }} >
      {!isImageLoaded && <div className="rounded-sm" style={{ width, height, backgroundColor: "rgba(59,130,246,0.5)" }} />}
      {isImageInView && (
        <img
          className="rounded-sm"
          onLoad={handleOnLoadImage}
          src={src}
          alt={alt}
          style={{ 
            width, 
            height, 
            opacity: isImageLoaded ? 1 : 0, 
            transition: "opacity 0.3s"
          }}
          {...rest}
        />
      )}
    </div>
  );
};

