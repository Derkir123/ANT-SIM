import { FONT, COLORS } from '../../data/constants';

export class TextInput {
  private container: HTMLDivElement;
  private input: HTMLInputElement;
  private label: HTMLLabelElement;
  private onChange: ((value: string) => void) | null = null;

  constructor(labelText: string, placeholder: string = '', initialValue: string = '', onChange?: (value: string) => void) {
    this.container = document.createElement('div');
    this.container.className = 'pixel-textinput';

    this.label = document.createElement('label');
    this.label.textContent = labelText;
    this.label.className = 'textinput-label';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.value = initialValue;
    this.input.placeholder = placeholder;
    this.input.className = 'textinput-input';

    if (onChange) {
      this.onChange = onChange;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.input.addEventListener('input', onChange as any);
    }

    this.applyStyles();
    this.container.appendChild(this.label);
    this.container.appendChild(this.input);
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

    this.input.style.fontFamily = FONT.SECONDARY;
    this.input.style.fontSize = '20px';
    this.input.style.padding = '10px 15px';
    this.input.style.backgroundColor = COLORS.UI_BUTTON;
    this.input.style.color = COLORS.UI_BUTTON_TEXT;
    this.input.style.border = `3px solid ${COLORS.UI_BORDER}`;
    this.input.style.width = '250px';
    this.input.style.outline = 'none';

    this.input.addEventListener('focus', () => {
      this.input.style.borderColor = COLORS.UI_TITLE;
    });

    this.input.addEventListener('blur', () => {
      this.input.style.borderColor = COLORS.UI_BORDER;
    });
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  getValue(): string {
    return this.input.value;
  }

  setValue(value: string): void {
    this.input.value = value;
  }

  setOnChange(callback: (value: string) => void): void {
    this.input.removeEventListener('input', this.onChange as unknown as EventListener);
    this.onChange = callback;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.input.addEventListener('input', callback as any);
  }
}