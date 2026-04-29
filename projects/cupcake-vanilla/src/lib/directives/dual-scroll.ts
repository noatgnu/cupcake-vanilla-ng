import { Directive, ElementRef, OnDestroy, AfterViewInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appDualScroll]',
  standalone: true
})
export class DualScrollDirective implements AfterViewInit, OnDestroy {
  private topBar: HTMLDivElement | null = null;
  private topBarInner: HTMLDivElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private readonly onHostScroll = () => {
    if (this.topBar) this.topBar.scrollLeft = this.el.nativeElement.scrollLeft;
  };

  private readonly onTopScroll = () => {
    this.el.nativeElement.scrollLeft = this.topBar!.scrollLeft;
  };

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;

    this.topBar = this.renderer.createElement('div') as HTMLDivElement;
    this.renderer.setStyle(this.topBar, 'overflow-x', 'auto');
    this.renderer.setStyle(this.topBar, 'overflow-y', 'hidden');
    this.renderer.setStyle(this.topBar, 'height', '10px');

    this.topBarInner = this.renderer.createElement('div') as HTMLDivElement;
    this.renderer.setStyle(this.topBarInner, 'height', '1px');
    this.topBar.appendChild(this.topBarInner);

    host.parentNode!.insertBefore(this.topBar, host);

    this.topBar.addEventListener('scroll', this.onTopScroll);
    host.addEventListener('scroll', this.onHostScroll);

    this.syncWidth();
    this.resizeObserver = new ResizeObserver(() => this.syncWidth());
    this.resizeObserver.observe(host);
  }

  private syncWidth(): void {
    if (this.topBarInner) {
      this.topBarInner.style.width = `${this.el.nativeElement.scrollWidth}px`;
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.topBar?.removeEventListener('scroll', this.onTopScroll);
    this.el.nativeElement.removeEventListener('scroll', this.onHostScroll);
    this.topBar?.remove();
  }
}
