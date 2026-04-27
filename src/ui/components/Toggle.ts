import { FONT, COLORS } from '../../data/constants';

export class Toggle {
  private container: HTMLDivElement;
  private checkbox: HTMLInputElement;
  private label: HTMLLabelElement;
  private onChange: ((value: boolean) => void) | null = null;

  constructor(labelText: string, initialValue: boolean = false, onChange?: (value: boolean) => void) {
    this.container = document.createElement('div');
    this.container.className = 'pixel-toggle';

    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.checked = initialValue;

    this.label = document.createElement('label');
    this.label.textContent = labelText;
    this.label.className = 'toggle-label';

    if (onChange) {
      this.onChange = onChange;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.checkbox.addEventListener('change', onChange as any);
    }

    this.applyStyles();
    this.container.appendChild(this.checkbox);
    this.container.appendChild(this.label);
  }

  private applyStyles(): void {
    this.container.style.display = 'flex';
    this.container.style.alignItems = 'center';
    this.container.style.gap = '15px';
    this.container.style.margin = '10px 0';

    this.label.style.fontFamily = FONT.BODY;
    this.label.style.fontSize = '14px';
    this.label.style.color = COLORS.UI_BUTTON_TEXT;

    this.checkbox.style.width = '20px';
    this.checkbox.style.height = '20px';
    this.checkbox.style.accentColor = COLORS.UI_BORDER;
    this.checkbox.style.cursor = 'pointer';
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  getValue(): boolean {
    return this.checkbox.checked;
  }

  setValue(value: boolean): void {
    this.checkbox.checked = value;
  }

  setOnChange(callback: (value: boolean) => void): void {
    this.checkbox.removeEventListener('change', this.onChange as unknown as EventListener);
    this.onChange = callback;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.checkbox.addEventListener('change', callback as any);
  }
}