import { Button } from '../components/Button';
import { screenManager, Screen, ScreenName } from './ScreenManager';
import { achievementSystem } from '../../systems/AchievementSystem';

export class Achievements implements Screen {
  name: ScreenName = 'achievements';
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'achievements-screen';
    this.container.style.display = 'none';
    this.build();
    screenManager.register(this);
  }

  private build(): void {
    this.container.innerHTML = '';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'ACHIEVEMENTS';
    this.container.appendChild(title);

    const unlocked = achievementSystem.getAchievements().filter(a => a.unlocked);
    const countText = document.createElement('p');
    countText.className = 'achievement-count';
    countText.textContent = `${unlocked.length} / ${achievementSystem.getAchievements().length} Unlocked`;
    this.container.appendChild(countText);

    const grid = document.createElement('div');
    grid.className = 'achievements-grid';

    achievementSystem.getAchievements().forEach(achievement => {
      const card = document.createElement('div');
      card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
      
      const icon = document.createElement('span');
      icon.className = 'achievement-icon';
      icon.textContent = achievement.unlocked ? achievement.icon : '🔒';
      
      const name = document.createElement('p');
      name.className = 'achievement-name';
      name.textContent = achievement.name;
      
      const desc = document.createElement('p');
      desc.className = 'achievement-desc';
      desc.textContent = achievement.description;

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(desc);
      grid.appendChild(card);
    });

    this.container.appendChild(grid);

    const backBtn = new Button('Back', () => screenManager.show('main'));
    const btnContainer = document.createElement('div');
    btnContainer.className = 'button-container';
    btnContainer.appendChild(backBtn.getElement());
    this.container.appendChild(btnContainer);
  }

  refresh(): void {
    this.build();
  }

  show(): void {
    this.refresh();
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.minHeight = '100vh';
    this.container.style.padding = '30px';
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = '';
    document.querySelector<HTMLDivElement>('#app')!.appendChild(this.container);
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}