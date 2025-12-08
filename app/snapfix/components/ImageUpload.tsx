'use client';

// app/snapfix/components/ImageUpload.tsx
// Beautiful image upload component with drag-and-drop and camera capture

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Camera, X, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    onImageSelect: (file: File) => void;
    selectedImage: File | null;
    onClear: () => void;
}

export default function ImageUpload({ onImageSelect, selectedImage, onClear }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('Image too large. Please select an image under 10MB');
            return;
        }

        onImageSelect(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleClear = () => {
        setPreview(null);
        onClear();
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    return (
        <div className="w-full">
            {!preview ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
            relative border-2 border-dashed rounded-3xl p-12
            transition-all duration-300 cursor-pointer
            ${isDragging
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                        }
          `}
                >
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl opacity-0 hover:opacity-100 transition-opacity" />

                    <div className="relative flex flex-col items-center gap-6">
                        <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shadow-lg shadow-blue-500/30">
                            <ImageIcon className="w-12 h-12 text-white" />
                        </div>

                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Upload a Photo
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Drag and drop an image here, or click to browse
                            </p>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                                >
                                    <Upload className="w-5 h-5" />
                                    Browse Files
                                </button>

                                <button
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                                >
                                    <Camera className="w-5 h-5" />
                                    Take Photo
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                                Supports: JPG, PNG, WebP (max 10MB)
                            </p>
                        </div>
                    </div>

                    {/* Hidden file inputs */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="relative rounded-3xl overflow-hidden border-2 border-gray-300 dark:border-gray-700 shadow-xl">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-auto max-h-[500px] object-contain bg-gray-100 dark:bg-gray-900"
                    />

                    <button
                        onClick={handleClear}
                        className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                        title="Remove image"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/70 text-white rounded-lg text-sm backdrop-blur-sm">
                        {selectedImage?.name}
                    </div>
                </div>
            )}
        </div>
    );
}
