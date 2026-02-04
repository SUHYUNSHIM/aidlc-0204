import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}

export function LazyImage({ src, alt, placeholder, className }: LazyImageProps): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsLoaded(true); // 에러 시에도 로딩 상태 해제
  };

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder || ''}
      alt={alt}
      className={`lazy-image ${isLoaded ? 'loaded' : 'loading'} ${className || ''}`}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        minHeight: '200px',
        backgroundColor: isLoaded ? 'transparent' : '#f0f0f0',
        objectFit: 'cover'
      }}
    />
  );
}
