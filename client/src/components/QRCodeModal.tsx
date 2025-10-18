import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
interface QRCodeModalProps {
  isOpen: boolean;
  onClose?: () => void;
  url: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, url }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen && url) {
      generateQRCode();
    }
  }, [isOpen, url]);

  const generateQRCode = async () => {
    setIsLoading(true);
    setError("");
    try {
      const encodedUrl = encodeURIComponent(url);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;

      await new Promise((resolve) => setTimeout(resolve, 500));

      setQrCodeUrl(qrUrl);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError("Failed to generate QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "qrcode.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-500/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">QR Code</h2>
          <button
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            {error ? (
              <div className="flex flex-col items-center space-y-4">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={generateQRCode}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : qrCodeUrl && !isLoading ? (
              <>
                <div className="border rounded-lg p-4 bg-white">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-[300px] h-[300px]"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center max-w-xs truncate">
                  {url}
                </p>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  <span className="font-medium text-gray-900">
                    Download QR Code
                  </span>
                </button>
              </>
            ) : null}
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center text-blue-600 absolute top-0 left-0 backdrop-blur-xs w-full h-full bg-white/80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mt-3">Generating QR code...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeModal;
