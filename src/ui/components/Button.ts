export class Button {
  private element: HTMLButtonElement;
  private onClick: (() => void) | null = null;

  constructor(text: string, onClick?: () => void) {
    this.element = document.createElement('button');
    this.element.textContent = text;
    this.element.className = 'pixel-button';
    
    if (onClick) {
      this.onClick = onClick;
      this.element.addEventListener('click', onClick);
    }
  }

  getElement(): HTMLButtonElement {
    return this.element;
  }

  setOnClick(callback: () => void): void {
    this.element.removeEventListener('click', this.onClick!);
    this.onClick = callback;
    this.element.addEventListener('click', callback);
  }

  setText(text: string): void {
    this.element.textContent = text;
  }

  disable(): void {
    this.element.disabled = true;
    this.element.style.opacity = '0.5';
    this.element.style.cursor = 'not-allowed';
  }

  enable(): void {
    this.element.disabled = false;
    this.element.style.opacity = '1';
    this.element.style.cursor = 'pointer';
  }
}