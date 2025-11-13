'use client';
import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

interface CustomImageProps extends ImageProps {
    alt: string;
    objectCenter?: boolean;
    timeAdd?: number;
}

const CustomImage = ({ src, alt, objectCenter, timeAdd, className = '', ...props }: CustomImageProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setHasError(false);

        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 200 + (timeAdd || 0));

        return () => clearTimeout(timer);
    }, [src]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
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
                    className={`w-full h-full object-cover ${objectCenter ? 'object-center' : 'object-top'} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
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