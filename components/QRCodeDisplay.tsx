
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useLocalization } from '../hooks/useLocalization';
import { Download, Loader2 } from 'lucide-react';

interface QRCodeDisplayProps {
  appointmentId: number;
  bookingData?: any; // New prop to pass full booking data to QR
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ appointmentId, bookingData }) => {
  const { t } = useLocalization();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      setIsLoading(true);
      if (!appointmentId) return;
      try {
        // Construct Payload with Client Name if available
        const payload = {
            appointmentId: appointmentId,
            clientName: bookingData?.clientName || 'Guest',
            date: bookingData?.date,
            time: bookingData?.time
        };
        const qrPayloadStr = JSON.stringify(payload);
        
        const url = await QRCode.toDataURL(qrPayloadStr, {
          width: 256,
          margin: 2,
          color: {
            dark: '#03045E', // dark
            light: '#FFFFFFFF',
          },
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      } finally {
          setIsLoading(false);
      }
    };
    generateQR();
  }, [appointmentId, bookingData]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `appointment-${appointmentId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
        <div className="w-48 h-48 mx-auto flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-md">
            <Loader2 className="animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <img src={qrCodeUrl} alt="Appointment QR Code" className="w-48 h-48 mx-auto" />
      <button
        onClick={handleDownload}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
      >
        <Download size={18} />
        {t('downloadQR')}
      </button>
    </div>
  );
};

export default QRCodeDisplay;
