import { FONT, COLORS } from '../../data/constants';

interface SelectOption {
  value: string;
  label: string;
}

export class Select {
  private container: HTMLDivElement;
  private select: HTMLSelectElement;
  private label: HTMLLabelElement;
  private onChange: ((value: string) => void) | null = null;

  constructor(labelText: string, options: SelectOption[], initialValue: string = '', onChange?: (value: string) => void) {
    this.container = document.createElement('div');
    this.container.className = 'pixel-select';

    this.label = document.createElement('label');
    this.label.textContent = labelText;
    this.label.className = 'select-label';

    this.select = document.createElement('select');
    this.select.className = 'select-input';
    
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      this.select.appendChild(option);
    });

    if (initialValue) {
      this.select.value = initialValue;
    }

    if (onChange) {
      this.onChange = onChange;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.select.addEventListener('change', onChange as any);
    }

    this.applyStyles();
    this.container.appendChild(this.label);
    this.container.appendChild(this.select);
  }

  private applyStyles(): void {
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'flex-start';
    this.container.style.gap = '8px';
    this.container.style.margin = '10px 0';

    this.label.style.fontFamily = FONT.BODY;
    this.label.style.fontSize = '14px';
    this.label.style.color = COLORS.UI_BUTTON_TEXT;

    this.select.style.fontFamily = FONT.SECONDARY;
    this.select.style.fontSize = '18px';
    this.select.style.padding = '8px 12px';
    this.select.style.backgroundColor = COLORS.UI_BUTTON;
    this.select.style.color = COLORS.UI_BUTTON_TEXT;
    this.select.style.border = `3px solid ${COLORS.UI_BORDER}`;
    this.select.style.cursor = 'pointer';
    this.select.style.minWidth = '200px';
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  getValue(): string {
    return this.select.value;
  }

  setValue(value: string): void {
    this.select.value = value;
  }

  setOnChange(callback: (value: string) => void): void {
    this.select.removeEventListener('change', this.onChange as unknown as EventListener);
    this.onChange = callback;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.select.addEventListener('change', callback as any);
  }
}