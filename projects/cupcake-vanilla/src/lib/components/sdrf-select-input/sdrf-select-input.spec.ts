import { signal, WritableSignal, EventEmitter } from '@angular/core';

describe('SdrfSelectInput', () => {
  let options: string[];
  let selectedValue: WritableSignal<string>;
  let isCustomMode: WritableSignal<boolean>;
  let valueChange: EventEmitter<string>;

  function onSelectionChange(value: string): void {
    if (value === '__custom__') {
      isCustomMode.set(true);
    } else {
      selectedValue.set(value);
      valueChange.emit(value);
    }
  }

  function onCustomValueChange(value: string): void {
    valueChange.emit(value);
  }

  beforeEach(() => {
    options = ['option1', 'option2', 'option3'];
    selectedValue = signal('');
    isCustomMode = signal(false);
    valueChange = new EventEmitter<string>();
  });

  it('should initialize with provided value', () => {
    selectedValue.set('option2');
    expect(selectedValue()).toBe('option2');
  });

  it('should emit value on selection change', (done) => {
    valueChange.subscribe(value => {
      expect(value).toBe('option1');
      done();
    });
    onSelectionChange('option1');
  });

  it('should switch to custom mode when special value selected', () => {
    onSelectionChange('__custom__');
    expect(isCustomMode()).toBe(true);
  });

  it('should emit custom value', (done) => {
    isCustomMode.set(true);
    valueChange.subscribe(value => {
      expect(value).toBe('custom value');
      done();
    });
    onCustomValueChange('custom value');
  });
});
