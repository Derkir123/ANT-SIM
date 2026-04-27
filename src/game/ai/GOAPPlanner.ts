import { AIContext } from './AIContext';
import { GOAPAction, Goal, WorldState, ActionResult, AntStateData, satisfiesState } from './types';

export class GOAPPlanner {
  private maxActionsPerPlan = 8;
  private maxPlanningTime = 0.005;

  plan(
    goals: Goal[],
    availableActions: GOAPAction[],
    currentWorldState: WorldState,
    ctx: AIContext
  ): { plan: GOAPAction[]; goal: Goal } | null {
    const startTime = performance.now();

    goals.sort((a, b) => b.priority(ctx) - a.priority(ctx));

    for (const goal of goals) {
      if (!goal.isValid(ctx)) continue;

      const plan = this.buildPlan(goal, availableActions, currentWorldState, startTime);
      if (plan) {
        return { plan, goal };
      }
    }

    return null;
  }

  private buildPlan(
    goal: Goal,
    actions: GOAPAction[],
    initialState: WorldState,
    startTime: number
  ): GOAPAction[] | null {
    let bestPlan: GOAPAction[] | null = null;
    let bestUtility = -Infinity;

    const candidates = this.expand(
      [{ state: { ...initialState }, plan: [] as GOAPAction[] }],
      actions,
      goal,
      startTime,
      0,
      0
    );

    for (const candidate of candidates) {
      if (candidate.plan.length === 0) continue;

      const utility = this.evaluatePlan(candidate.plan, candidate.state, goal);

      if (utility > bestUtility) {
        bestUtility = utility;
        bestPlan = candidate.plan;
      }
    }

    return bestPlan;
  }

  private expand(
    frontier: Array<{ state: WorldState; plan: GOAPAction[] }>,
    allActions: GOAPAction[],
    goal: Goal,
    startTime: number,
    depth: number,
    totalCost: number
  ): Array<{ state: WorldState; plan: GOAPAction[] }> {
    if (frontier.length === 0) return [];
    if (depth >= this.maxActionsPerPlan) return [];
    if (performance.now() - startTime > this.maxPlanningTime * 1000) return [];

    const results: Array<{ state: WorldState; plan: GOAPAction[] }> = [];

    for (const node of frontier) {
      for (const action of allActions) {
        if (node.plan.some(a => a.name === action.name && action.cost > 0)) continue;

        if (!this.meetsPreconditions(node.state, action)) continue;

        const newState = this.applyEffects(node.state, action);
        const newCost = totalCost + action.cost;
        const newPlan = [...node.plan, action];

        results.push({ state: newState, plan: newPlan });

        if (this.goalSatisfied(newState, goal)) {
          return [{ state: newState, plan: newPlan }];
        }
      }
    }

    if (results.length > 0 && depth < this.maxActionsPerPlan - 1) {
      const nextFrontier = results.slice(0, 10);
      return this.expand(nextFrontier, allActions, goal, startTime, depth + 1, totalCost);
    }

    return results;
  }

  private meetsPreconditions(state: WorldState, action: GOAPAction): boolean {
    return satisfiesState(state, action.preconditions);
  }

  private applyEffects(state: WorldState, action: GOAPAction): WorldState {
    const newState = { ...state };

    if (action.effects.set) {
      for (const [key, value] of Object.entries(action.effects.set)) {
        (newState as Record<string, unknown>)[key] = value;
      }
    }

    if (action.effects.unset) {
      for (const [key] of Object.entries(action.effects.unset)) {
        (newState as Record<string, unknown>)[key] = undefined;
      }
    }

    return newState;
  }

  private goalSatisfied(state: WorldState, goal: Goal): boolean {
    return goal.isValid({} as AIContext);
  }

  private evaluatePlan(plan: GOAPAction[], finalState: WorldState, goal: Goal): number {
    let score = goal.priority({} as AIContext) * 10;

    score -= plan.reduce((sum, a) => sum + a.cost, 0) * 0.5;

    if (finalState.isCarrying && plan.some(a => a.name === 'collectFood')) {
      score += 5;
    }

    const completedGoals = plan.map(a => a.name).join(',');
    if (completedGoals.includes('deposit') || completedGoals.includes('forage')) {
      score += 2;
    }

    return score;
  }
}