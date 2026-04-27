import { Button } from '../components/Button';
import { screenManager, Screen, ScreenName } from './ScreenManager';
import { FONT, COLORS } from '../../data/constants';

export class Help implements Screen {
  name: ScreenName = 'help';
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'help-screen';
    this.container.style.display = 'none';
    this.build();
    screenManager.register(this);
  }

  private build(): void {
    this.container.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'HELP';
    title.style.fontFamily = FONT.PRIMARY;
    title.style.fontSize = '24px';
    title.style.color = COLORS.UI_TITLE;
    title.style.textAlign = 'center';
    title.style.marginBottom = '30px';
    this.container.appendChild(title);

    const helpContent = document.createElement('div');
    helpContent.className = 'help-content';
    helpContent.style.fontFamily = FONT.SECONDARY;
    helpContent.style.fontSize = '18px';
    helpContent.style.color = COLORS.UI_BUTTON_TEXT;
    helpContent.style.maxWidth = '600px';
    helpContent.style.textAlign = 'left';
    helpContent.innerHTML = `
      <h3 style="font-family: ${FONT.PRIMARY}; font-size: 14px; color: ${COLORS.UI_TITLE}; margin-top: 20px;">CONTROLS</h3>
      <div style="margin: 10px 0; padding: 10px; border: 2px solid ${COLORS.UI_BORDER};">
        <p><strong style="color: ${COLORS.UI_TITLE}">WASD</strong> - Move ant</p>
        <p><strong style="color: ${COLORS.UI_TITLE}">SPACE</strong> - Pause game</p>
        <p><strong style="color: ${COLORS.UI_TITLE}">1 / 2 / 3</strong> - Game speed</p>
        <p><strong style="color: ${COLORS.UI_TITLE}">CLICK</strong> - Control ant</p>
        <p><strong style="color: ${COLORS.UI_TITLE}">ESC</strong> - Release / Menu</p>
        <p><strong style="color: ${COLORS.UI_TITLE}">E</strong> - Interact</p>
        <p><strong style="color: ${COLORS.UI_TITLE}">Q</strong> - Quick command</p>
        <p><strong style="color: ${COLORS.UI_TITLE}">F5</strong> - Quick save</p>
      </div>

      <h3 style="font-family: ${FONT.PRIMARY}; font-size: 14px; color: ${COLORS.UI_TITLE}; margin-top: 20px;">OBJECTIVE</h3>
      <p>Build and manage your ant colony. Gather food, expand your nest, defend against predators, and grow your colony into a powerful empire.</p>

      <h3 style="font-family: ${FONT.PRIMARY}; font-size: 14px; color: ${COLORS.UI_TITLE}; margin-top: 20px;">TIPS</h3>
      <ul style="list-style: disc; padding-left: 20px;">
        <li>Start by gathering food for your queen</li>
        <li>Build a waste chamber to prevent disease</li>
        <li>Assign roles to optimize your colony</li>
        <li>Scouts reveal the map and find food</li>
        <li>Soldiers defend against predators</li>
        <li>Build multiple entrances for safety</li>
      </ul>
    `;

    this.container.appendChild(helpContent);

    const backBtn = new Button('Back', () => screenManager.show('main'));
    backBtn.getElement().style.marginTop = '30px';
    this.container.appendChild(backBtn.getElement());
  }

  show(): void {
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.height = '100vh';
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = '';
    document.querySelector<HTMLDivElement>('#app')!.appendChild(this.container);
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}