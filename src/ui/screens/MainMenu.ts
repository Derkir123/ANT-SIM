import { Button } from '../components/Button';
import { screenManager, Screen, ScreenName } from './ScreenManager';
import { DIFFICULTY, Difficulty } from '../../data/constants';
import { PHRASES } from '../../data/phrases';
import { achievementSystem } from '../../systems/AchievementSystem';
import menuBackground from '../../assets/backgrounds/menu-colony-bg.png';

const DIFFICULTY_INFO = {
  [DIFFICULTY.BEGINNER]: {
    label: 'BEGINNER',
    description: 'A relaxed start with forgiving systems and steady resources.'
  },
  [DIFFICULTY.NORMAL]: {
    label: 'NORMAL',
    description: 'Balanced survival pressure with standard colony growth pacing.'
  },
  [DIFFICULTY.HARD]: {
    label: 'HARD',
    description: 'Scarce resources and stronger threats demand careful planning.'
  },
  [DIFFICULTY.REALISTIC]: {
    label: 'REALISTIC',
    description: 'Harsh ecosystem rules where every mistake can cascade.'
  }
};

export class MainMenu implements Screen {
  name: ScreenName = 'main';
  private container: HTMLElement;
  private buttons: Button[] = [];
  private difficultyButtons: Button[] = [];
  private difficulty: Difficulty = DIFFICULTY.BEGINNER;
  private descriptionEl: HTMLElement;
  private chatCloud: HTMLElement;
  private phraseInterval: number | null = null;
  private viewedPhrases: Set<string> = new Set();
  private phrasePool: string[] = [];
  private phraseCursor = 0;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'main-menu';
    this.container.style.backgroundImage = `linear-gradient(rgba(15, 10, 8, 0.28), rgba(15, 10, 8, 0.45)), url(${menuBackground})`;
    this.container.style.backgroundSize = 'cover';
    this.container.style.backgroundPosition = 'center';

    this.descriptionEl = document.createElement('p');
    this.chatCloud = document.createElement('div');

    this.refillPhrasePool();
    this.build();
    screenManager.register(this);
  }

  private build(): void {
    this.container.innerHTML = '';

    const layout = document.createElement('div');
    layout.className = 'menu-layout';

    const leftScene = document.createElement('div');
    leftScene.className = 'menu-left-scene';

    this.chatCloud.className = 'chat-cloud';
    this.chatCloud.textContent = this.getNextPhrase();
    leftScene.appendChild(this.chatCloud);

    const rightPanel = document.createElement('div');
    rightPanel.className = 'menu-right-panel';

    const title = document.createElement('h1');
    title.className = 'menu-title';
    title.textContent = 'ANT SIMULATOR';
    rightPanel.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'menu-subtitle';
    subtitle.textContent = 'Build your colony. Defend your queen.';
    rightPanel.appendChild(subtitle);

    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-buttons';

    const tutorialBtn = new Button('TUTORIAL', () => screenManager.show('help'));
    const newGameBtn = new Button('NEW GAME', () => this.openNewGame());
    const loadGameBtn = new Button('LOAD GAME', () => screenManager.show('loadGame'));
    const settingsBtn = new Button('SETTINGS', () => screenManager.show('settings'));
    const achievementsBtn = new Button('ACHIEVEMENTS', () => screenManager.show('achievements'));
    const helpBtn = new Button('HELP', () => screenManager.show('help'));
    const aboutBtn = new Button('ABOUT', () => screenManager.show('about'));

    this.buttons = [tutorialBtn, newGameBtn, loadGameBtn, settingsBtn, achievementsBtn, helpBtn, aboutBtn];
    this.buttons.forEach((btn) => menuContainer.appendChild(btn.getElement()));
    rightPanel.appendChild(menuContainer);

    const diffSection = document.createElement('div');
    diffSection.className = 'difficulty-section';

    const diffLabel = document.createElement('span');
    diffLabel.className = 'section-label';
    diffLabel.textContent = 'DIFFICULTY';
    diffSection.appendChild(diffLabel);

    this.descriptionEl.className = 'difficulty-quote';
    this.descriptionEl.textContent = DIFFICULTY_INFO[this.difficulty].description;
    diffSection.appendChild(this.descriptionEl);

    const diffButtons = document.createElement('div');
    diffButtons.className = 'difficulty-buttons';

    const difficulties = [DIFFICULTY.BEGINNER, DIFFICULTY.NORMAL, DIFFICULTY.HARD, DIFFICULTY.REALISTIC];

    this.difficultyButtons = [];
    difficulties.forEach((diff) => {
      const btn = new Button(DIFFICULTY_INFO[diff].label, () => {
        this.difficulty = diff;
        this.descriptionEl.textContent = DIFFICULTY_INFO[diff].description;
        this.difficultyButtons.forEach((b) => b.getElement().classList.remove('active'));
        btn.getElement().classList.add('active');
      });

      if (diff === this.difficulty) {
        btn.getElement().classList.add('active');
      }

      this.difficultyButtons.push(btn);
      diffButtons.appendChild(btn.getElement());
    });

    diffSection.appendChild(diffButtons);
    rightPanel.appendChild(diffSection);

    layout.appendChild(leftScene);
    layout.appendChild(rightPanel);
    this.container.appendChild(layout);

    const version = document.createElement('p');
    version.className = 'version-text';
    version.textContent = 'v0.2.0';
    this.container.appendChild(version);
  }

  private openNewGame(): void {
    const newGameScreen = screenManager.getScreen('newGame') as { setDifficulty?: (difficulty: Difficulty) => void } | undefined;
    newGameScreen?.setDifficulty?.(this.difficulty);
    screenManager.show('newGame');
  }

  private refillPhrasePool(): void {
    this.phrasePool = [...PHRASES]
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((entry) => entry.value);
    this.phraseCursor = 0;
  }

  private getNextPhrase(): string {
    if (this.phraseCursor >= this.phrasePool.length) {
      this.refillPhrasePool();
    }

    const phrase = this.phrasePool[this.phraseCursor] ?? PHRASES[0];
    this.phraseCursor += 1;

    if (!this.viewedPhrases.has(phrase)) {
      this.viewedPhrases.add(phrase);
      if (this.viewedPhrases.size >= PHRASES.length) {
        achievementSystem.unlock('phrase_collector');
      }
    }

    return phrase;
  }

  private setPhrase(phrase: string, animate = true): void {
    if (!animate) {
      this.chatCloud.textContent = phrase;
      return;
    }

    this.chatCloud.classList.add('fade');
    window.setTimeout(() => {
      this.chatCloud.textContent = phrase;
      this.chatCloud.classList.remove('fade');
    }, 180);
  }

  private startPhraseRotation(): void {
    if (this.phraseInterval) return;

    this.setPhrase(this.getNextPhrase(), false);

    this.phraseInterval = window.setInterval(() => {
      this.setPhrase(this.getNextPhrase(), true);
    }, 20000);
  }

  private stopPhraseRotation(): void {
    if (this.phraseInterval) {
      clearInterval(this.phraseInterval);
      this.phraseInterval = null;
    }
  }

  show(): void {
    this.container.style.display = 'flex';
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = '';
    document.querySelector<HTMLDivElement>('#app')!.appendChild(this.container);
    this.startPhraseRotation();
  }

  hide(): void {
    this.container.style.display = 'none';
    this.stopPhraseRotation();
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }
}
