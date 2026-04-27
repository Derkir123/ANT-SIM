import { AIContext } from './AIContext';
import { Predator, AntStateData } from './types';

export type ReactiveAction = 'none' | 'flee' | 'attack' | 'swarm' | 'alarm';

export interface ReactiveResult {
  action: ReactiveAction;
  targetX?: number;
  targetY?: number;
  priority: number;
  message?: string;
}

export class ReactiveLayer {
  private fleeRadius = 150;
  private attackRadius = 60;
  private swarmRadius = 200;
  private alarmRadius = 100;

  evaluate(
    ant: { x: number; y: number; role: string; health: number; hunger: number },
    state: AntStateData,
    ctx: AIContext
  ): ReactiveResult {
    const nearestPredator = ctx.getNearestPredator(ant.x, ant.y);

    if (!nearestPredator) {
      return { action: 'none', priority: 0 };
    }

    const dist = ctx.distance(ant.x, ant.y, nearestPredator.x, nearestPredator.y);

    if (dist <= 30) {
      return this.evaluateCombat(ant, nearestPredator, dist, ctx);
    }

    if (dist <= this.fleeRadius) {
      return this.evaluateFlee(ant, nearestPredator, dist, ctx);
    }

    if (dist <= this.alarmRadius && ant.role === 'guard') {
      return {
        action: 'alarm',
        priority: 8,
        message: 'Guard broadcasting alarm',
      };
    }

    if (dist <= this.swarmRadius && ant.role === 'soldier') {
      return this.evaluateSwarm(ant, nearestPredator, dist, ctx);
    }

    return { action: 'none', priority: 0 };
  }

  private evaluateCombat(
    ant: { x: number; y: number; role: string; health: number },
    predator: Predator,
    dist: number,
    ctx: AIContext
  ): ReactiveResult {
    if (ant.health < 25) {
      return this.evaluateFlee(ant, predator, dist, ctx);
    }

    if (ant.role === 'soldier' || ant.role === 'guard' || ant.role === 'worker') {
      return {
        action: 'attack',
        targetX: predator.x,
        targetY: predator.y,
        priority: 10,
        message: `${ant.role} engaging ${predator.type}`,
      };
    }

    if (ant.role === 'scout' || ant.role === 'nurse') {
      return this.evaluateFlee(ant, predator, dist, ctx);
    }

    return { action: 'none', priority: 0 };
  }

  private evaluateFlee(
    ant: { x: number; y: number },
    predator: Predator,
    dist: number,
    ctx: AIContext
  ): ReactiveResult {
    const fleeX = ant.x + (ant.x - predator.x);
    const fleeY = ant.y + (ant.y - predator.y);

    const nearestEntrance = ctx.getNearestFood(ant.x, ant.y);
    const entrance = ctx.getColonyPosition();

    const distToEntrance = ctx.distance(ant.x, ant.y, entrance.x, entrance.y);
    const distToFleePoint = ctx.distance(ant.x, ant.y, fleeX, fleeY);

    let targetX: number, targetY: number;
    if (distToEntrance < distToFleePoint && distToEntrance < 300) {
      targetX = entrance.x;
      targetY = entrance.y;
    } else {
      targetX = fleeX;
      targetY = fleeY;
    }

    return {
      action: 'flee',
      targetX,
      targetY,
      priority: 9,
      message: `Fleeing from ${predator.type}`,
    };
  }

  private evaluateSwarm(
    ant: { x: number; y: number; role: string },
    predator: Predator,
    dist: number,
    ctx: AIContext
  ): ReactiveResult {
    const nearbySoldiers = ctx.getAntsByRole('soldier').filter(s => {
      const sDist = ctx.distance(ant.x, ant.y, s.x, s.y);
      return sDist <= this.swarmRadius;
    });

    if (nearbySoldiers.length >= 3) {
      return {
        action: 'swarm',
        targetX: predator.x,
        targetY: predator.y,
        priority: 9,
        message: `Swarm forming with ${nearbySoldiers.length} soldiers`,
      };
    }

    if (ant.role === 'soldier') {
      return {
        action: 'attack',
        targetX: predator.x,
        targetY: predator.y,
        priority: 9,
        message: 'Soldier converging on threat',
      };
    }

    return this.evaluateFlee(ant, predator, dist, ctx);
  }

  setFleeRadius(radius: number): void {
    this.fleeRadius = radius;
  }

  setAttackRadius(radius: number): void {
    this.attackRadius = radius;
  }

  setSwarmRadius(radius: number): void {
    this.swarmRadius = radius;
  }
}