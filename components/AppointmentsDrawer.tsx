
import React, { useState, useEffect } from 'react';
import { AuthenticatedUser, AppointmentForDisplay } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { supabase } from '../services/supabaseClient';
import { Loader2, X, Calendar, MapPin } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

interface AppointmentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthenticatedUser | null;
}

const AppointmentsDrawer: React.FC<AppointmentsDrawerProps> = ({ isOpen, onClose, user }) => {
  const { t } = useLocalization();
  const [appointments, setAppointments] = useState<AppointmentForDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      const fetchAppointments = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const { data, error } = await supabase
            .from('appointments')
            .select(`
              id,
              created_at,
              providers (name, service_type, location)
            `)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setAppointments(data as AppointmentForDisplay[]);
        } catch (e: any) {
          setError(t('errorMessage'));
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAppointments();
    }
  }, [isOpen, user, t]);

  const renderAppointmentCard = (app: AppointmentForDisplay) => (
    <div key={app.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-primary dark:text-secondary">{app.providers.service_type}</h4>
          <p className="text-sm text-dark dark:text-light font-semibold">{app.providers.name}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
             <MapPin size={12} />
             <span>{app.providers.location}</span>
          </div>
        </div>
        <button
            onClick={() => setSelectedAppointmentId(app.id)}
            className="text-xs px-2 py-1 bg-secondary text-white rounded-md hover:bg-primary transition-colors"
        >
            {t('viewQRCode')}
        </button>
      </div>
       <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
      <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>{t('bookedOn')} {new Date(app.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose}></div>
    <div className="fixed top-0 right-0 rtl:left-0 rtl:right-auto h-full w-full max-w-md bg-gray-100 dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out" style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}>
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-dark dark:text-light">{t('myAppointments')}</h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
          <X size={24} className="text-dark dark:text-light" />
        </button>
      </div>
      <div className="p-4 h-[calc(100vh-65px)] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : appointments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-10">{t('noAppointmentsFound')}</p>
        ) : (
          <div className="space-y-6">
            <div>
                 {/* Since we removed date filtering, just show all appointments list */}
                <div className="space-y-3">
                    {appointments.map(renderAppointmentCard)}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
    {selectedAppointmentId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAppointmentId(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
                <QRCodeDisplay appointmentId={selectedAppointmentId} />
                <button onClick={() => setSelectedAppointmentId(null)} className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-dark dark:text-light rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">{t('close')}</button>
            </div>
        </div>
    )}
    </>
  );
};

export default AppointmentsDrawer;
