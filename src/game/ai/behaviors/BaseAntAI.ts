import { AntRole } from '../../ColonyState';
import { AIContext } from '../AIContext';
import { GOAPAction, Goal, WorldState, AntStateData, ActionResult } from '../types';
import { ReactiveLayer, ReactiveResult } from '../ReactiveLayer';

export abstract class BaseAntAI {
  abstract readonly role: AntRole;
  abstract readonly displayName: string;

  protected actions: GOAPAction[] = [];
  protected ctx: AIContext;
  protected reactiveLayer: ReactiveLayer;

  protected speed: number;
  protected turnSpeed: number;
  protected detectionRadius: number;
  protected maxDistance: number;
  protected wanderChance: number;

  protected decisionInterval = 0.15;
  protected replanInterval = 2.0;

  constructor(ctx: AIContext) {
    this.ctx = ctx;
    this.reactiveLayer = new ReactiveLayer();

    this.speed = this.getRoleSpeed();
    this.turnSpeed = this.getRoleTurnSpeed();
    this.detectionRadius = this.getRoleDetectionRadius();
    this.maxDistance = this.getRoleMaxDistance();
    this.wanderChance = this.getRoleWanderChance();
  }

  abstract getGoals(): Goal[];

  getActions(): GOAPAction[] {
    return this.actions;
  }

  getWorldState(ant: { id: string; role: AntRole; x: number; y: number; hunger: number; health: number; isCarrying: boolean; carryingType?: string }, state: AntStateData, isControlledByPlayer: boolean): WorldState {
    return this.ctx.buildWorldState(
      ant as any,
      { x: state.x, y: state.y, angle: state.angle, isControlledByPlayer }
    );
  }

  executeAction(
    action: GOAPAction,
    ant: { id: string; x: number; y: number; hunger: number; health: number; isCarrying: boolean; carryingType?: string },
    state: AntStateData,
    deltaSeconds: number
  ): ActionResult {
    const result = action.execute(this.ctx, state);
    return result;
  }

  evaluateReactive(
    ant: { x: number; y: number; role: string; health: number; hunger: number },
    state: AntStateData
  ): ReactiveResult {
    return this.reactiveLayer.evaluate(ant as any, state, this.ctx);
  }

  updateMovement(
    ant: { x: number; y: number; hunger: number; health: number; isCarrying: boolean },
    state: AntStateData,
    deltaSeconds: number
  ): void {
    this.updateSteering(ant as any, state, deltaSeconds);
  }

  protected updateSteering(
    ant: { x: number; y: number; isCarrying: boolean },
    state: AntStateData,
    deltaSeconds: number
  ): void {
    if (state.targetX === null || state.targetY === null) {
      state.targetX = null;
      state.targetY = null;
      state.targetAngle = state.angle + (Math.random() - 0.5) * 0.3;
      return;
    }

    const tx = state.targetX as number;
    const ty = state.targetY as number;
    const dx = tx - state.x;
    const dy = ty - state.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      state.targetX = null;
      state.targetY = null;
      return;
    }

    const targetAngle = Math.atan2(dy, dx);
    state.targetAngle = targetAngle;

    let angleDiff = targetAngle - state.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxTurn = this.turnSpeed * deltaSeconds;
    if (angleDiff > maxTurn) {
      state.angle += maxTurn;
    } else if (angleDiff < -maxTurn) {
      state.angle -= maxTurn;
    } else {
      state.angle = targetAngle;
    }

    const actualSpeed = this.speed;
    state.x += Math.cos(state.angle) * actualSpeed * deltaSeconds;
    state.y += Math.sin(state.angle) * actualSpeed * deltaSeconds;

    const homeDist = Math.sqrt(
      Math.pow(state.x - state.homeX, 2) + Math.pow(state.y - state.homeY, 2)
    );
    if (homeDist > this.maxDistance && !ant.isCarrying) {
      state.targetX = state.homeX;
      state.targetY = state.homeY;
    }
  }

  protected steerToward(state: AntStateData, x: number, y: number): void {
    state.targetX = x;
    state.targetY = y;
  }

  protected setWanderTarget(state: AntStateData): void {
    const angle = state.angle + (Math.random() - 0.5) * Math.PI;
    const distance = 20 + Math.random() * 40;

    const homeDist = Math.sqrt(
      Math.pow(state.x - state.homeX, 2) + Math.pow(state.y - state.homeY, 2)
    );

    let finalAngle = angle;
    if (homeDist > this.maxDistance * 0.8) {
      finalAngle = Math.atan2(state.homeY - state.y, state.homeX - state.x);
      finalAngle += (Math.random() - 0.5) * Math.PI * 0.5;
    }

    state.targetX = state.x + Math.cos(finalAngle) * distance;
    state.targetY = state.y + Math.sin(finalAngle) * distance;
  }

  protected getColonyPosition(): { x: number; y: number } {
    return this.ctx.getColonyPosition();
  }

  protected getNearestFood(x: number, y: number) {
    return this.ctx.getNearestFood(x, y);
  }

  protected needsReplan(state: AntStateData, deltaSeconds: number): boolean {
    if (!state.lastReplanTime) {
      state.lastReplanTime = 0;
    }
    state.lastReplanTime += deltaSeconds;

    if (state.lastReplanTime >= this.replanInterval) {
      state.lastReplanTime = 0;
      return true;
    }

    if (state.targetX === null || state.targetY === null) {
      return true;
    }

    return false;
  }

  protected getDecisionInterval(): number {
    return this.decisionInterval;
  }

  getSpeed(): number {
    return this.speed;
  }

  getDetectionRadius(): number {
    return this.detectionRadius;
  }

  protected getRoleSpeed(): number {
    return 35;
  }

  protected getRoleTurnSpeed(): number {
    return 8;
  }

  protected getRoleDetectionRadius(): number {
    return 200;
  }

  protected getRoleMaxDistance(): number {
    return 250;
  }

  protected getRoleWanderChance(): number {
    return 0.08;
  }
}