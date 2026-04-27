import { ACHIEVEMENTS } from '../data/phrases';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

class AchievementSystem {
  private achievements: Achievement[] = [...ACHIEVEMENTS];
  private unlockedCount: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  getAchievements(): Achievement[] {
    return this.achievements;
  }

  getUnlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  unlock(id: string): boolean {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.unlockedCount++;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  isUnlocked(id: string): boolean {
    const achievement = this.achievements.find(a => a.id === id);
    return achievement?.unlocked ?? false;
  }

  reset(): void {
    this.achievements.forEach(a => a.unlocked = false);
    this.unlockedCount = 0;
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      const data = this.achievements.map(a => ({ id: a.id, unlocked: a.unlocked }));
      localStorage.setItem('antSim_achievements', JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save achievements');
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('antSim_achievements');
      if (data) {
        const parsed = JSON.parse(data);
        parsed.forEach((item: { id: string; unlocked: boolean }) => {
          const achievement = this.achievements.find(a => a.id === item.id);
          if (achievement) {
            achievement.unlocked = item.unlocked;
          }
        });
        this.unlockedCount = this.achievements.filter(a => a.unlocked).length;
      }
    } catch (e) {
      console.warn('Could not load achievements');
    }
  }
}

export const achievementSystem = new AchievementSystem();