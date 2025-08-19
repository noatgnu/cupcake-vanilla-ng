/**
 * Simple authentication test utility
 * This file can be used to manually test authentication flows
 */

import { Injectable } from '@angular/core';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class AuthTestService {
  constructor(private authService: AuthService) {}

  /**
   * Test token expiration detection
   */
  testTokenExpiration(): void {
    const validToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM0MzQzMjAwLCJpYXQiOjE3MzQzMzkzMzAsImp0aSI6ImIzZTk4YzRjM2I2ODRkN2RhMDc4OTcwNDY2N2M1MmRhIiwidXNlcl9pZCI6MX0.test';
    const expiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNTAwMDAwMDAwLCJpYXQiOjE1MDAwMDAwMDAsImp0aSI6ImIzZTk4YzRjM2I2ODRkN2RhMDc4OTcwNDY2N2M1MmRhIiwidXNlcl9pZCI6MX0.test';
    
    console.log('Valid token expired?', this.authService['isTokenExpired'](validToken));
    console.log('Expired token expired?', this.authService['isTokenExpired'](expiredToken));
  }

  /**
   * Test authentication state
   */
  testAuthState(): void {
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('Current user:', this.authService.getCurrentUser());
    console.log('Access token:', this.authService.getAccessToken());
    console.log('Refresh token:', this.authService.getRefreshToken());
  }

  /**
   * Subscribe to authentication observables
   */
  subscribeToAuthState(): void {
    this.authService.isAuthenticated$.subscribe(
      isAuth => console.log('Auth state changed:', isAuth)
    );
    
    this.authService.currentUser$.subscribe(
      user => console.log('User changed:', user)
    );
  }
}