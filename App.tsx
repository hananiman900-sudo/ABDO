
import React, { useState, useEffect, useRef } from 'react';
import { UserView, Language, AuthenticatedUser, AccountType } from './types';
import Chatbot from './components/Chatbot';
import ProviderPortal from './components/QRScanner';
import AppointmentsDrawer from './components/AppointmentsDrawer';
import DatabaseSetup from './components/Database