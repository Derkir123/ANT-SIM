import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { ColorPicker } from '../components/ColorPicker';
import { Select } from '../components/Select';
import { Toggle } from '../components/Toggle';
import { screenManager, Screen, ScreenName } from './ScreenManager';
import { FONT, COLORS, DIFFICULTY, MAP_SIZES, ANT_SPECIES, Difficulty, MapSize } from '../../data/constants';

export interface GameSettings {
  colonyName: string;
  colonyColor: string;
  antSpecies: string;
  mapSize: MapSize;
  enableSeasons: boolean;
  difficulty: Difficulty;
  preExistingColony: boolean;
}

let pendingSettings: GameSettings | null = null;

export function getPendingGameSettings(): GameSettings | null {
  const settings = pendingSettings;
  pendingSettings = null;
  return settings;
}

export class NewGame implements Screen {
  name: ScreenName = 'newGame';
  private container: HTMLElement;
  private colonyNameInput: TextInput;
  private colorPicker: ColorPicker;
  private speciesSelect: Select;
  private mapSizeSelect: Select;
  private seasonToggle: Toggle;
  private preExistingToggle: Toggle;
  private difficulty: Difficulty = DIFFICULTY.BEGINNER;

  constructor(difficulty: Difficulty = DIFFICULTY.BEGINNER) {
    this.difficulty = difficulty;
    this.container = document.createElement('div');
    this.container.className = 'newgame-screen';
    this.container.style.display = 'none';
    this.build();
    screenManager.register(this);
  }

  private build(): void {
    this.container.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'NEW GAME';
    title.style.fontFamily = FONT.PRIMARY;
    title.style.fontSize = '24px';
    title.style.color = COLORS.UI_TITLE;
    title.style.textAlign = 'center';
    title.style.marginBottom = '30px';
    this.container.appendChild(title);

    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';

    this.colonyNameInput = new TextInput('Colony Name', 'Enter colony name...', 'My Colony');
    formContainer.appendChild(this.colonyNameInput.getElement());

    this.colorPicker = new ColorPicker('Colony Color', '#4a3728');
    formContainer.appendChild(this.colorPicker.getElement());

    this.speciesSelect = new Select('Ant Species', [
      { value: ANT_SPECIES.COMMON_BLACK.id, label: ANT_SPECIES.COMMON_BLACK.name }
    ], ANT_SPECIES.COMMON_BLACK.id);
    this.speciesSelect.getElement().querySelector('select')!.disabled = true;
    formContainer.appendChild(this.speciesSelect.getElement());

    const mapSizeOptions = Object.entries(MAP_SIZES).map(([key, value]) => ({
      value: key,
      label: `${value.label} (${value.width}x${value.height})`
    }));
    this.mapSizeSelect = new Select('Map Size', mapSizeOptions, 'MEDIUM');
    formContainer.appendChild(this.mapSizeSelect.getElement());

    this.seasonToggle = new Toggle('Enable Seasons', true);
    formContainer.appendChild(this.seasonToggle.getElement());

    if (this.difficulty !== DIFFICULTY.BEGINNER) {
      this.preExistingToggle = new Toggle('Pre-existing Colony', true);
      formContainer.appendChild(this.preExistingToggle.getElement());
    }

    this.container.appendChild(formContainer);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const startBtn = new Button('Start Game', () => this.startGame());
    const backBtn = new Button('Back', () => screenManager.show('main'));

    buttonContainer.appendChild(startBtn.getElement());
    buttonContainer.appendChild(backBtn.getElement());

    this.container.appendChild(buttonContainer);
  }

  private startGame(): void {
    const settings: GameSettings = {
      colonyName: this.colonyNameInput.getValue() || 'My Colony',
      colonyColor: this.colorPicker.getValue(),
      antSpecies: this.speciesSelect.getValue(),
      mapSize: this.mapSizeSelect.getValue() as MapSize,
      enableSeasons: this.seasonToggle.getValue(),
      difficulty: this.difficulty,
      preExistingColony: (this.difficulty === DIFFICULTY.BEGINNER) || (this.preExistingToggle?.getValue() ?? true)
    };

    pendingSettings = settings;
    console.log('Starting game with settings:', settings);
    screenManager.show('game');
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
    this.build();
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