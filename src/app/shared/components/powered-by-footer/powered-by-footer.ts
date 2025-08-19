import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteConfigService } from '../../services/site-config';

@Component({
  selector: 'app-powered-by-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './powered-by-footer.html',
  styleUrl: './powered-by-footer.scss'
})
export class PoweredByFooterComponent {
  private siteConfigService = inject(SiteConfigService);
  
  // Observable for site configuration
  siteConfig$ = this.siteConfigService.config$;
}