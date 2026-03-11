import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteConfigService } from '../../services/site-config';

@Component({
  selector: 'ccc-powered-by-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './powered-by-footer.html',
  styleUrl: './powered-by-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PoweredByFooterComponent {
  private siteConfigService = inject(SiteConfigService);

  siteConfig$ = this.siteConfigService.config$;
}