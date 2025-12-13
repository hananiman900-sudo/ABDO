
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useLocalization } from '../hooks/useLocalization';
import { Download, Loader2, Share2, AlertTriangle } from 'lucide-react';

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
        // Construct Payload with Client Name, Provider ID and Offer
        const payload = {
            appointmentId: appointmentId,
            clientName: bookingData?.name || bookingData?.clientName || 'Guest',
            providerId: bookingData?.providerId, // CRITICAL for security check
            offerTitle: bookingData?.offerTitle, // CRITICAL for display
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

  const handleAction = async () => {
    if (!qrCodeUrl) return;

    try {
        // Convert Base64 to Blob
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], `appointment-${appointmentId}.png`, { type: 'image/png' });

        // Try Web Share API first (Best for Mobile Apps)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: 'TangerConnect Appointment',
                    text: `Appointment ID: ${appointmentId}`,
                    files: [file]
                });
                return; // Success, exit
            } catch (err) {
                console.log("Share failed or cancelled, falling back to download");
            }
        }

        // Fallback: Direct Download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `appointment-${appointmentId}.png`;
        document.body.appendChild(link);
        link.click();
        
        // Use timeout to safely remove link
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

    } catch (e) {
        console.error("Action failed", e);
        // Do not alert error to prevent crash/confusion, rely on the visual instruction below
    }
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
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <img src={qrCodeUrl} alt="Appointment QR Code" className="w-48 h-48 mx-auto" />
      </div>
      
      {/* Visual Instruction for Mobile App Users */}
      <div className="mt-2 text-center">
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            اضغط مطولاً على الصورة لحفظها <br/>
            (Long press to save)
          </p>
          
          <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-100 dark:border-yellow-800">
              <p className="text-[9px] text-yellow-700 dark:text-yellow-400 flex items-center justify-center gap-1">
                  <AlertTriangle size={10}/>
                  <span>إذا واجهت مشكلة في التحميل، ستجد هذا الكود في خانة "مواعيدي" في قسم الخدمات.</span>
              </p>
          </div>
      </div>

      <button
        onClick={handleAction}
        className="mt-3 flex items-center gap-2 px-6 py-2 bg-secondary text-white rounded-full hover:bg-primary transition-colors text-sm font-bold shadow-md active:scale-95"
      >
        {/* Show Share icon on mobile-ish capability, else Download */}
        {navigator.share ? <Share2 size={16} /> : <Download size={16} />}
        {navigator.share ? t('share') : t('downloadQR')}
      </button>
    </div>
  );
};

export default QRCodeDisplay;
