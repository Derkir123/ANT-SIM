export type ScreenName = 'main' | 'newGame' | 'loadGame' | 'settings' | 'help' | 'about' | 'achievements' | 'game';

export interface Screen {
  name: ScreenName;
  show(): void;
  hide(): void;
}

class ScreenManager {
  private screens: Map<ScreenName, Screen> = new Map();
  private currentScreen: ScreenName = 'main';

  register(screen: Screen): void {
    this.screens.set(screen.name, screen);
  }

  show(screenName: ScreenName): void {
    const current = this.screens.get(this.currentScreen);
    if (current) {
      current.hide();
    }

    const next = this.screens.get(screenName);
    if (next) {
      next.show();
      this.currentScreen = screenName;
    }
  }

  getCurrentScreen(): ScreenName {
    return this.currentScreen;
  }

  getScreen(screenName: ScreenName): Screen | undefined {
    return this.screens.get(screenName);
  }
}

export const screenManager = new ScreenManager();