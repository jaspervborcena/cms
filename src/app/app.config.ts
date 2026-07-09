import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

const firebaseConfig = environment.firebase.projectId ? environment.firebase : null;
const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : null;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    ...(firebaseApp ? [provideFirebaseApp(() => firebaseApp)] : []),
    ...(firebaseApp ? [provideAuth(() => getAuth())] : []),
    ...(firebaseApp ? [provideFirestore(() => getFirestore())] : []),
    ...(firebaseApp ? [provideStorage(() => getStorage())] : [])
  ]
};
