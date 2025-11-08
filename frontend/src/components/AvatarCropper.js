import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Save, RotateCw } from 'lucide-react';

const AvatarCropper = ({ src, onCrop, onClose, onSave }) => {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    aspect: 1,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const onImageLoad = useCallback((img) => {
    imgRef.current = img;
    // Tạo crop mặc định: hình vuông 90% ở giữa ảnh
    const displayWidth = img.width;
    const displayHeight = img.height;
    const sizePx = Math.floor(Math.min(displayWidth, displayHeight) * 0.9);
    const x = Math.floor((displayWidth - sizePx) / 2);
    const y = Math.floor((displayHeight - sizePx) / 2);

    setCompletedCrop({
      unit: 'px',
      x,
      y,
      width: sizePx,
      height: sizePx,
    });
  }, []);

  const getCroppedImg = (image, crop, rotation = 0) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty');
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleSave = async () => {
    if (!imgRef.current) return;

    try {
      // Nếu người dùng chưa kéo chỉnh, dùng crop mặc định ở giữa
      let cropToUse = completedCrop;
      if (!cropToUse || !cropToUse.width || !cropToUse.height) {
        const img = imgRef.current;
        const displayWidth = img.width;
        const displayHeight = img.height;
        const sizePx = Math.floor(Math.min(displayWidth, displayHeight) * 0.9);
        const x = Math.floor((displayWidth - sizePx) / 2);
        const y = Math.floor((displayHeight - sizePx) / 2);
        cropToUse = { unit: 'px', x, y, width: sizePx, height: sizePx };
      }

      console.log('Starting crop with:', { completedCrop: cropToUse, rotation });
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        cropToUse,
        rotation
      );
      
      console.log('Cropped blob:', croppedImageBlob);
      await onSave(croppedImageBlob);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chỉnh sửa ảnh đại diện</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative inline-block">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={src}
                onLoad={onImageLoad}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  maxHeight: '400px',
                  maxWidth: '100%',
                }}
              />
            </ReactCrop>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRotate}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              <RotateCw className="h-4 w-4" />
              <span>Xoay</span>
            </button>
            
            <div className="text-sm text-gray-600">
              <p>• Kéo để chọn vùng ảnh</p>
              <p>• Ảnh sẽ được cắt thành hình vuông</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              <span>Lưu ảnh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;
