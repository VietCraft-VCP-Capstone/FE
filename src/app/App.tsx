import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppRouter } from './router';

import { ToastProvider } from '../shared/components/Toast';

const GOOGLE_CLIENT_ID = '79575387043-ng99ltl9sancsg3afvcaslvt8m1hj8el.apps.googleusercontent.com';

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ToastProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
