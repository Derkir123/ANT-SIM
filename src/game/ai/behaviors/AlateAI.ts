import { BaseAntAI } from './BaseAntAI';
import { AIContext } from '../AIContext';
import { GOAPAction, Goal, AntStateData } from '../types';

export class AlateAI extends BaseAntAI {
  readonly role = 'alate' as const;
  readonly displayName = 'Alate';

  private hasFlown = false;
  private searchTimer = 0;
  private foundSite: { x: number; y: number } | null = null;

  constructor(ctx: AIContext) {
    super(ctx);
    this.actions = this.buildActions();
  }

  protected getRoleSpeed(): number {
    return 55;
  }

  protected getRoleTurnSpeed(): number {
    return 6;
  }

  protected getRoleDetectionRadius(): number {
    return 500;
  }

  protected getRoleMaxDistance(): number {
    return 600;
  }

  protected getRoleWanderChance(): number {
    return 0.25;
  }

  getGoals(): Goal[] {
    return [
      {
        name: 'survive',
        priority: () => 8,
        isValid: () => true,
      },
      {
        name: 'matingFlight',
        priority: () => {
          const season = this.ctx.getSeason();
          return (season === 'spring' || season === 'summer') && !this.hasFlown ? 7 : 2;
        },
        isValid: () => true,
      },
      {
        name: 'findColonySite',
        priority: () => this.hasFlown ? 6 : 1,
        isValid: () => this.hasFlown && !this.foundSite,
      },
      {
        name: 'foundColony',
        priority: () => this.foundSite ? 8 : 1,
        isValid: () => this.foundSite !== null,
      },
      {
        name: 'wander',
        priority: () => 2,
        isValid: () => true,
      },
    ];
  }

  private buildActions(): GOAPAction[] {
    return [
      this.createMatingFlightAction(),
      this.createSearchSiteAction(),
      this.createFoundColonyAction(),
      this.createWanderAction(),
    ];
  }

  private createMatingFlightAction(): GOAPAction {
    return {
      name: 'matingFlight',
      cost: 2,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        if (this.hasFlown) {
          return { done: true, success: true };
        }
        if (state.targetX === null) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 150 + Math.random() * 300;
          state.targetX = state.x + Math.cos(angle) * dist;
          state.targetY = state.y + Math.sin(angle) * dist;
        }
        this.searchTimer += 0.016;
        if (this.searchTimer > 60) {
          this.hasFlown = true;
          this.searchTimer = 0;
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }

  private createSearchSiteAction(): GOAPAction {
    return {
      name: 'searchSite',
      cost: 3,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        if (this.foundSite) {
          return { done: true, success: true };
        }
        if (state.targetX === null) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 80 + Math.random() * 150;
          state.targetX = state.x + Math.cos(angle) * dist;
          state.targetY = state.y + Math.sin(angle) * dist;
        }
        this.searchTimer += 0.016;
        const x = state.x;
        const y = state.y;
        const nearbyFoods = ctx.getFoodSources();
        const hasShelter = nearbyFoods.some((t) => ctx.distance(x, y, t.x, t.y) < 100);
        if (hasShelter && this.searchTimer > 30) {
          this.foundSite = { x, y };
          return { done: true, success: true };
        }
        if (this.searchTimer > 90) {
          this.foundSite = { x, y };
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }

  private createFoundColonyAction(): GOAPAction {
    return {
      name: 'foundColony',
      cost: 1,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        if (!this.foundSite) {
          return { done: true, success: false };
        }
        this.steerToward(state, this.foundSite.x, this.foundSite.y);
        const dist = ctx.distance(state.x, state.y, this.foundSite.x, this.foundSite.y);
        if (dist < 20) {
          ctx.addPheromone(this.foundSite.x, this.foundSite.y, 'recruitment', 1);
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }

  private createWanderAction(): GOAPAction {
    return {
      name: 'wander',
      cost: 3,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        if (state.targetX === null) {
          this.setWanderTarget(state);
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }
}