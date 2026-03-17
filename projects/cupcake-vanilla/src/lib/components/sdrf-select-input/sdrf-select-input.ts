import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ccv-sdrf-select-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sdrf-select-input.html',
  styleUrl: './sdrf-select-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdrfSelectInput implements OnInit, OnChanges {
  @Input() value: string = '';
  @Input() options: string[] = [];
  @Input() placeholder: string = 'Select a value';
  @Input() description: string = '';
  @Input() allowCustom: boolean = false;
  @Output() valueChange = new EventEmitter<string>();

  selectedValue = signal<string>('');
  isCustomMode = signal<boolean>(false);
  customValue = signal<string>('');

  ngOnInit() {
    this.initializeValue();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && !changes['value'].firstChange) {
      this.initializeValue();
    }
  }

  private initializeValue() {
    if (this.value) {
      if (this.options.includes(this.value)) {
        this.selectedValue.set(this.value);
        this.isCustomMode.set(false);
      } else if (this.allowCustom) {
        this.isCustomMode.set(true);
        this.customValue.set(this.value);
        this.selectedValue.set('__custom__');
      } else {
        this.selectedValue.set(this.value);
      }
    }
  }

  onSelectionChange(value: string) {
    this.selectedValue.set(value);
    if (value === '__custom__') {
      this.isCustomMode.set(true);
    } else {
      this.isCustomMode.set(false);
      this.valueChange.emit(value);
    }
  }

  onCustomValueChange(value: string) {
    this.customValue.set(value);
    this.valueChange.emit(value);
  }

  toggleCustomMode() {
    this.isCustomMode.set(!this.isCustomMode());
    if (this.isCustomMode()) {
      this.selectedValue.set('__custom__');
    }
  }
}
