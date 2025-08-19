'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface CustomImageProps extends ImageProps {
    alt: string;
}

const CustomImage = ({ src, alt, className = '', ...props }: CustomImageProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
            {isLoading && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"></div>
                </div>
            )}
            {hasError ? (
                <div className="flex items-center justify-center w-full h-full bg-red-50 text-red-600 text-center">
                    Không thể tải ảnh
                </div>
            ) : (
                <Image
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoadingComplete={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                    {...props}
                />
            )}
        </div>
    );
};

export default CustomImage;