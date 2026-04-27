import { Button } from '../components/Button';
import { screenManager, Screen, ScreenName } from './ScreenManager';
import { FONT, COLORS } from '../../data/constants';

export class LoadGame implements Screen {
  name: ScreenName = 'loadGame';
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'loadgame-screen';
    this.container.style.display = 'none';
    this.build();
    screenManager.register(this);
  }

  private build(): void {
    this.container.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'LOAD GAME';
    title.style.fontFamily = FONT.PRIMARY;
    title.style.fontSize = '24px';
    title.style.color = COLORS.UI_TITLE;
    title.style.textAlign = 'center';
    title.style.marginBottom = '30px';
    this.container.appendChild(title);

    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'slots-container';

    for (let i = 1; i <= 10; i++) {
      const slot = document.createElement('div');
      slot.className = 'save-slot';
      slot.style.padding = '15px 20px';
      slot.style.margin = '10px 0';
      slot.style.backgroundColor = COLORS.UI_BUTTON;
      slot.style.border = `3px solid ${COLORS.UI_BORDER}`;
      slot.style.display = 'flex';
      slot.style.justifyContent = 'space-between';
      slot.style.alignItems = 'center';

      const slotInfo = document.createElement('div');
      slotInfo.innerHTML = `<span style="color: ${COLORS.UI_BUTTON_TEXT}; font-family: ${FONT.BODY};">Slot ${i}</span><br>
        <span style="color: #6b4423; font-family: ${FONT.SECONDARY};">Empty</span>`;
      slot.appendChild(slotInfo);

      const loadBtn = new Button('Load', () => {
        console.log('Load slot', i);
      });
      loadBtn.getElement().style.fontSize = '8px';
      loadBtn.getElement().style.padding = '8px 15px';
      slot.appendChild(loadBtn.getElement());

      slotsContainer.appendChild(slot);
    }

    this.container.appendChild(slotsContainer);

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