import { Button } from '../components/Button';
import { screenManager, Screen, ScreenName } from './ScreenManager';
import { FONT, COLORS } from '../../data/constants';

export class About implements Screen {
  name: ScreenName = 'about';
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'about-screen';
    this.container.style.display = 'none';
    this.build();
    screenManager.register(this);
  }

  private build(): void {
    this.container.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'ABOUT';
    title.style.fontFamily = FONT.PRIMARY;
    title.style.fontSize = '24px';
    title.style.color = COLORS.UI_TITLE;
    title.style.textAlign = 'center';
    title.style.marginBottom = '30px';
    this.container.appendChild(title);

    const aboutContent = document.createElement('div');
    aboutContent.className = 'about-content';
    aboutContent.style.maxWidth = '600px';
    aboutContent.style.textAlign = 'center';
    aboutContent.innerHTML = `
      <h2 style="font-family: ${FONT.PRIMARY}; font-size: 20px; color: ${COLORS.UI_TITLE}; margin-bottom: 10px;">ANT SIMULATOR</h2>
      <p style="font-family: ${FONT.SECONDARY}; font-size: 20px; color: ${COLORS.UI_BUTTON_TEXT}; margin: 20px 0;">Build Your Colony. Defend Your Queen.</p>
      
      <div style="border: 3px solid ${COLORS.UI_BORDER}; padding: 20px; margin: 20px 0;">
        <p style="font-family: ${FONT.SECONDARY}; font-size: 18px; color: ${COLORS.UI_BUTTON_TEXT};">Version 0.1.0</p>
        <p style="font-family: ${FONT.SECONDARY}; font-size: 16px; color: #6b4423; margin-top: 10px;">An 8-bit style ant colony simulation game</p>
      </div>

      <h3 style="font-family: ${FONT.PRIMARY}; font-size: 14px; color: ${COLORS.UI_TITLE}; margin-top: 30px;">CREDITS</h3>
      <div style="font-family: ${FONT.SECONDARY}; font-size: 18px; color: ${COLORS.UI_BUTTON_TEXT}; margin: 15px 0;">
        <p>Created with TypeScript & Vite</p>
        <p>8-bit fonts by Google Fonts</p>
      </div>

      <h3 style="font-family: ${FONT.PRIMARY}; font-size: 14px; color: ${COLORS.UI_TITLE}; margin-top: 30px;">FEATURES</h3>
      <ul style="list-style: disc; text-align: left; display: inline-block; font-family: ${FONT.SECONDARY}; font-size: 16px; color: ${COLORS.UI_BUTTON_TEXT};">
        <li>Multiple difficulty levels</li>
        <li>4 game modes</li>
        <li>Colony management system</li>
        <li>Pheromone trail system</li>
        <li>Day/night cycle</li>
        <li>Seasonal events</li>
        <li>Various ant roles</li>
        <li>Customizable colony</li>
      </ul>
    `;

    this.container.appendChild(aboutContent);

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