import { FONT, COLORS } from '../../data/constants';

export class ColorPicker {
  private container: HTMLDivElement;
  private input: HTMLInputElement;
  private label: HTMLLabelElement;
  private preview: HTMLDivElement;
  private onChange: ((value: string) => void) | null = null;

  constructor(labelText: string, initialValue: string = '#4a3728', onChange?: (value: string) => void) {
    this.container = document.createElement('div');
    this.container.className = 'pixel-colorpicker';

    this.label = document.createElement('label');
    this.label.textContent = labelText;
    this.label.className = 'colorpicker-label';

    const controlRow = document.createElement('div');
    controlRow.className = 'colorpicker-row';

    this.input = document.createElement('input');
    this.input.type = 'color';
    this.input.value = initialValue;

    this.preview = document.createElement('div');
    this.preview.className = 'colorpicker-preview';
    this.preview.style.backgroundColor = initialValue;

    if (onChange) {
      this.onChange = onChange;
      const handler = () => {
        this.preview.style.backgroundColor = this.input.value;
        onChange(this.input.value);
      };
      this.input.addEventListener('input', handler as EventListener);
    }

    controlRow.appendChild(this.input);
    controlRow.appendChild(this.preview);
    this.container.appendChild(this.label);
    this.container.appendChild(controlRow);
    
    this.applyStyles();
  }

  private applyStyles(): void {
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'flex-start';
    this.container.style.gap = '8px';
    this.container.style.margin = '10px 0';

    this.label.style.fontFamily = "'VT323', monospace";
    this.label.style.fontSize = '18px';
    this.label.style.color = '#d4a574';

    this.input.style.width = '50px';
    this.input.style.height = '40px';
    this.input.style.border = '3px solid #6b4423';
    this.input.style.cursor = 'pointer';
    this.input.style.padding = '0';

    this.preview.style.width = '50px';
    this.preview.style.height = '40px';
    this.preview.style.border = '3px solid #6b4423';
    this.preview.style.display = 'inline-block';
  }

  getElement(): HTMLDivElement {
    return this.container;
  }

  getValue(): string {
    return this.input.value;
  }

  setValue(value: string): void {
    this.input.value = value;
    this.preview.style.backgroundColor = value;
  }

  setOnChange(callback: (value: string) => void): void {
    this.input.removeEventListener('input', this.onChange as unknown as EventListener);
    this.onChange = callback;
    const handler = () => {
      this.preview.style.backgroundColor = this.input.value;
      callback(this.input.value);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.input.addEventListener('input', handler as any);
  }
}