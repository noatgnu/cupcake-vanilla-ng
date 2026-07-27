export * from './models';
export * from './services';
export * from './components';

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'ccv-cupcake-vanilla',
  imports: [],
  template: `
    <p>
      cupcake-vanilla works!
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: ``
})
export class CupcakeVanilla {

}
