import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DemoModeService } from '../services/demo-mode';

@Injectable()
export class DemoModeInterceptor implements HttpInterceptor {

  constructor(private demoModeService: DemoModeService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const demoModeHeader = event.headers.get('X-Demo-Mode');

          if (demoModeHeader === 'true') {
            const cleanupInterval = parseInt(
              event.headers.get('X-Demo-Cleanup-Interval') || '15',
              10
            );
            this.demoModeService.setDemoMode(true, cleanupInterval);
          } else if (demoModeHeader === 'false') {
            this.demoModeService.setDemoMode(false);
          }
        }
      })
    );
  }
}
