import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import { Select } from '../components/Select';
import { screenManager, Screen, ScreenName } from './ScreenManager';
import { FONT, COLORS } from '../../data/constants';

export class Settings implements Screen {
  name: ScreenName = 'settings';
  private container: HTMLElement;
  private fogOfWarToggle: Toggle;
  private pheromonesToggle: Toggle;
  private volumeSelect: Select;
  private musicSelect: Select;
  private fullscreenToggle: Toggle;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'settings-screen';
    this.container.style.display = 'none';
    this.build();
    screenManager.register(this);
  }

  private build(): void {
    this.container.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'SETTINGS';
    title.style.fontFamily = FONT.PRIMARY;
    title.style.fontSize = '24px';
    title.style.color = COLORS.UI_TITLE;
    title.style.textAlign = 'center';
    title.style.marginBottom = '30px';
    this.container.appendChild(title);

    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'settings-container';

    const audioSection = document.createElement('div');
    audioSection.className = 'settings-section';
    audioSection.innerHTML = `<h3 style="font-family: ${FONT.PRIMARY}; font-size: 12px; color: ${COLORS.UI_TITLE}; margin-bottom: 15px;">AUDIO</h3>`;

    this.volumeSelect = new Select('SFX Volume', [
      { value: '0', label: '0%' },
      { value: '25', label: '25%' },
      { value: '50', label: '50%' },
      { value: '75', label: '75%' },
      { value: '100', label: '100%' }
    ], '100');
    audioSection.appendChild(this.volumeSelect.getElement());

    this.musicSelect = new Select('Music Volume', [
      { value: '0', label: '0%' },
      { value: '25', label: '25%' },
      { value: '50', label: '50%' },
      { value: '75', label: '75%' },
      { value: '100', label: '100%' }
    ], '50');
    audioSection.appendChild(this.musicSelect.getElement());

    settingsContainer.appendChild(audioSection);

    const displaySection = document.createElement('div');
    displaySection.className = 'settings-section';
    displaySection.innerHTML = `<h3 style="font-family: ${FONT.PRIMARY}; font-size: 12px; color: ${COLORS.UI_TITLE}; margin-bottom: 15px;">DISPLAY</h3>`;

    this.fullscreenToggle = new Toggle('Fullscreen', false);
    displaySection.appendChild(this.fullscreenToggle.getElement());

    this.fogOfWarToggle = new Toggle('Fog of War', true);
    this.fogOfWarToggle.setValue(true);
    displaySection.appendChild(this.fogOfWarToggle.getElement());

    this.pheromonesToggle = new Toggle('Show Pheromones', true);
    this.pheromonesToggle.setValue(true);
    displaySection.appendChild(this.pheromonesToggle.getElement());

    settingsContainer.appendChild(displaySection);

    this.container.appendChild(settingsContainer);

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