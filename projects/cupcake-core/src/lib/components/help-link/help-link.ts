import { Component, inject, input } from '@angular/core';
import { HelpService } from '../../services/help';

/** A link to the manual's page for the current screen, shown only when the app is served with its manual. */
@Component({
  selector: 'ccc-help-link',
  imports: [],
  templateUrl: './help-link.html',
  styleUrl: './help-link.scss'
})
export class HelpLink {
  protected readonly help = inject(HelpService);

  readonly linkClass = input('nav-link');
  readonly showLabel = input(false);
}
