import { ApplicationConfig, provideZoneChangeDetection, inject, importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { FirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

// Temporarily disable Firebase providers to avoid runtime injection errors
// (will re-enable once initialization is verified)
const hasFirebase = false && !!(environment.firebase && environment.firebase.projectId);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    importProvidersFrom(BrowserModule),
    provideRouter(routes),
    ...(hasFirebase ? [provideFirebaseApp(() => initializeApp(environment.firebase))] : []),
    ...(hasFirebase ? [provideAuth(() => getAuth(inject(FirebaseApp)))] : []),
    ...(hasFirebase ? [provideFirestore(() => getFirestore(inject(FirebaseApp)))] : []),
    ...(hasFirebase ? [provideStorage(() => getStorage(inject(FirebaseApp)))] : [])
  ]
};
