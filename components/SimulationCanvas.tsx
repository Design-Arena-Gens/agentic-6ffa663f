"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type PlayerRole = "Batter" | "All-Rounder" | "Bowler" | "Keeper";

export interface PlayerProfile {
  name: string;
  role: PlayerRole;
  batting: number;
  bowling: number;
  stamina: number;
}

export interface TeamProfile {
  id: string;
  name: string;
  shortName: string;
  coach: string;
  captain: string;
  formation: string;
  primaryColor: string;
  secondaryColor: string;
  lineup: PlayerProfile[];
}

export interface SimulationSnapshot {
  innings: number;
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  overs: string;
  currentOverSymbols: string[];
  runRate: number;
  requiredRunRate?: number;
  target?: number;
  commentary: string[];
  striker: BatterSnapshot | null;
  nonStriker: BatterSnapshot | null;
  bowler: BowlerSnapshot | null;
  result?: string;
}

interface BatterSnapshot {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

interface BowlerSnapshot {
  name: string;
  overs: string;
  wickets: number;
  runs: number;
}

interface SimulationCanvasProps {
  teams: TeamProfile[];
  maxOvers: number;
  speed: number;
  onSnapshot?: (snapshot: SimulationSnapshot) => void;
}

type OutcomeType =
  | "dot"
  | "single"
  | "double"
  | "triple"
  | "four"
  | "six"
  | "wicket"
  | "wide"
  | "bye"
  | "legBye";

interface OutcomeDefinition {
  type: OutcomeType;
  runs: number;
  description: string;
  symbol: string;
}

interface BallFlight {
  start: { x: number; y: number };
  end: { x: number; y: number };
  duration: number;
  startTime: number;
  easing: (t: number) => number;
  next?: BallFlight | null;
}

interface BatterInnings {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
}

interface BowlerSpell {
  name: string;
  balls: number;
  runs: number;
  wickets: number;
}

interface InternalState {
  innings: 1 | 2;
  battingTeamIndex: number;
  bowlingTeamIndex: number;
  strikerIndex: number;
  nonStrikerIndex: number;
  nextBatterIndex: number;
  bowlerIndex: number;
  runs: number;
  wickets: number;
  balls: number;
  wides: number;
  legByes: number;
  byes: number;
  commentary: string[];
  currentOverSymbols: string[];
  battingScorecard: BatterInnings[];
  bowlingScorecard: BowlerSpell[];
  firstInningsRuns?: number;
  firstInningsWickets?: number;
  firstInningsBalls?: number;
  target?: number;
  result?: string;
  isComplete: boolean;
}

const BASE_DELIVERY_INTERVAL = 1400;

const outcomeTable: { weight: number; outcome: OutcomeDefinition }[] = [
  { weight: 0.25, outcome: { type: "dot", runs: 0, description: "Defended solidly.", symbol: "·" } },
  { weight: 0.23, outcome: { type: "single", runs: 1, description: "Guided into the gap.", symbol: "1" } },
  { weight: 0.13, outcome: { type: "double", runs: 2, description: "Quick couple taken.", symbol: "2" } },
  { weight: 0.03, outcome: { type: "triple", runs: 3, description: "Hard running for three.", symbol: "3" } },
  { weight: 0.12, outcome: { type: "four", runs: 4, description: "Cracked to the rope!", symbol: "4" } },
  { weight: 0.07, outcome: { type: "six", runs: 6, description: "Launched over the fence!", symbol: "6" } },
  { weight: 0.1, outcome: { type: "wicket", runs: 0, description: "Wicket! Big breakthrough.", symbol: "W" } },
  { weight: 0.04, outcome: { type: "wide", runs: 1, description: "Bowled too wide.", symbol: "Wd" } },
  { weight: 0.02, outcome: { type: "bye", runs: 1, description: "Sneaky bye taken.", symbol: "B" } },
  { weight: 0.01, outcome: { type: "legBye", runs: 1, description: "Off the pads for a leg bye.", symbol: "Lb" } }
];

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

function formatOvers(balls: number): string {
  const completedOvers = Math.floor(balls / 6);
  const remainder = balls % 6;
  return `${completedOvers}.${remainder}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function SimulationCanvas({ teams, maxOvers, speed, onSnapshot }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const lastBallRef = useRef<number>(0);
  const ballFlightRef = useRef<BallFlight | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);

  const teamsMemo = useMemo(() => {
    if (teams.length >= 2) {
      return teams.slice(0, 2);
    }
    const placeholder: TeamProfile = {
      id: "placeholder",
      name: "Training XI",
      shortName: "TRN",
      coach: "Analytics Suite",
      captain: "A. Leader",
      formation: "Balanced",
      primaryColor: "#38bdf8",
      secondaryColor: "#0ea5e9",
      lineup: new Array(11).fill(null).map((_, idx) => ({
        name: `Player ${idx + 1}`,
        role: idx < 5 ? "Batter" : idx < 7 ? "All-Rounder" : idx < 10 ? "Bowler" : "Keeper",
        batting: 65,
        bowling: 62,
        stamina: 70
      }))
    };
    return [teams[0] ?? placeholder, teams[1] ?? placeholder];
  }, [teams]);

  const initialStateRef = useRef<InternalState | null>(null);

  const initializeState = useCallback(() => {
    const battingTeamIndex = 0;
    const bowlingTeamIndex = 1;
    const battingTeam = teamsMemo[battingTeamIndex];
    const bowlingTeam = teamsMemo[bowlingTeamIndex];

    const battingScorecard: BatterInnings[] = battingTeam.lineup.map((player, index) => ({
      name: player.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: index >= 2
    }));

    battingScorecard[0].out = false;
    battingScorecard[1].out = false;

    const bowlingScorecard: BowlerSpell[] = bowlingTeam.lineup.map((player, index) => ({
      name: player.name,
      balls: 0,
      runs: 0,
      wickets: 0
    }));

    const state: InternalState = {
      innings: 1,
      battingTeamIndex,
      bowlingTeamIndex,
      strikerIndex: 0,
      nonStrikerIndex: 1,
      nextBatterIndex: 2,
      bowlerIndex: 6,
      runs: 0,
      wickets: 0,
      balls: 0,
      wides: 0,
      legByes: 0,
      byes: 0,
      commentary: [],
      currentOverSymbols: [],
      battingScorecard,
      bowlingScorecard,
      isComplete: false
    };

    initialStateRef.current = state;
    return state;
  }, [teamsMemo]);

  const gameStateRef = useRef<InternalState>(initializeState());

  const broadcastSnapshot = useCallback(
    (state: InternalState) => {
      const battingTeam = teamsMemo[state.battingTeamIndex];
      const bowlingTeam = teamsMemo[state.bowlingTeamIndex];
      const striker = state.battingScorecard[state.strikerIndex] ?? null;
      const nonStriker = state.battingScorecard[state.nonStrikerIndex] ?? null;
      const bowler = state.bowlingScorecard[state.bowlerIndex] ?? null;
      const oversString = formatOvers(state.balls);
      const runRate = state.balls > 0 ? (state.runs / (state.balls / 6)) : 0;
      const chasingBalls = state.balls - (state.innings === 2 && state.firstInningsBalls ? state.firstInningsBalls : 0);

      const snapshotPayload: SimulationSnapshot = {
        innings: state.innings,
        battingTeam: battingTeam.name,
        bowlingTeam: bowlingTeam.name,
        runs: state.runs,
        wickets: state.wickets,
        overs: oversString,
        currentOverSymbols: state.currentOverSymbols,
        runRate,
        requiredRunRate:
          state.innings === 2 && state.target
            ? (state.target - state.runs) / Math.max((maxOvers * 6 - state.balls) / 6, 0.1)
            : undefined,
        target: state.target,
        commentary: state.commentary.slice(-5),
        striker: striker
          ? {
              name: striker.name,
              runs: striker.runs,
              balls: striker.balls,
              fours: striker.fours,
              sixes: striker.sixes
            }
          : null,
        nonStriker: nonStriker
          ? {
              name: nonStriker.name,
              runs: nonStriker.runs,
              balls: nonStriker.balls,
              fours: nonStriker.fours,
              sixes: nonStriker.sixes
            }
          : null,
        bowler: bowler
          ? {
              name: bowler.name,
              overs: formatOvers(bowler.balls),
              wickets: bowler.wickets,
              runs: bowler.runs
            }
          : null,
        result: state.result
      };

      setSnapshot(snapshotPayload);
      if (onSnapshot) {
        onSnapshot(snapshotPayload);
      }
    },
    [onSnapshot, teamsMemo, maxOvers]
  );

  const resetGame = useCallback(() => {
    const resetState = initializeState();
    gameStateRef.current = resetState;
    lastBallRef.current = 0;
    ballFlightRef.current = null;
    setIsRunning(false);
    broadcastSnapshot(resetState);
  }, [initializeState, broadcastSnapshot]);

  useEffect(() => {
    // Reinitialize when teams or overs change.
    resetGame();
  }, [resetGame]);

  const rollOutcome = useCallback(() => {
    const totalWeight = outcomeTable.reduce((acc, curr) => acc + curr.weight, 0);
    let pick = Math.random() * totalWeight;
    for (const entry of outcomeTable) {
      if (pick < entry.weight) {
        return entry.outcome;
      }
      pick -= entry.weight;
    }
    return outcomeTable[0].outcome;
  }, []);

  const queueBallFlight = useCallback((flights: BallFlight[]) => {
    if (flights.length === 0) {
      ballFlightRef.current = null;
      return;
    }
    for (let i = 0; i < flights.length - 1; i += 1) {
      flights[i].next = flights[i + 1];
    }
    flights[flights.length - 1].next = null;
    ballFlightRef.current = flights[0];
  }, []);

  const batsmanPosition = useMemo(() => {
    const width = 720;
    const height = 400;
    return {
      striker: { x: width / 2, y: height / 2 + 64 },
      nonStriker: { x: width / 2, y: height / 2 - 64 },
      bowler: { x: width / 2, y: height / 2 - 160 },
      keeper: { x: width / 2, y: height / 2 + 130 }
    };
  }, []);

  const triggerBallAnimation = useCallback(
    (outcome: OutcomeDefinition) => {
      const width = 720;
      const height = 400;
      const deliveryStart = { x: batsmanPosition.bowler.x, y: batsmanPosition.bowler.y + 20 };
      const strikerPos = { x: batsmanPosition.striker.x, y: batsmanPosition.striker.y - 10 };

      const boundaryTargets: Record<string, { x: number; y: number }> = {
        default: { x: width / 2 + 20, y: height / 2 - 180 },
        off: { x: width / 2 + 220, y: height / 2 - 40 },
        leg: { x: width / 2 - 220, y: height / 2 + 40 },
        straight: { x: width / 2, y: height / 2 - 200 }
      };

      const randomAngle = Math.random();
      const hitTarget =
        outcome.type === "four"
          ? randomAngle > 0.5
            ? boundaryTargets.off
            : boundaryTargets.leg
          : outcome.type === "six"
          ? boundaryTargets.straight
          : outcome.type === "triple"
          ? { x: width / 2 - 180 + Math.random() * 60, y: height / 2 - 120 - Math.random() * 40 }
          : outcome.type === "double"
          ? { x: width / 2 + 160, y: height / 2 - 30 }
          : outcome.type === "single" || outcome.type === "bye" || outcome.type === "legBye"
          ? { x: width / 2 + 110, y: height / 2 - 20 }
          : outcome.type === "wide"
          ? { x: width / 2 + 140, y: height / 2 - 140 }
          : outcome.type === "wicket"
          ? { x: width / 2 + 50, y: height / 2 - 120 }
          : { x: width / 2 + 40, y: height / 2 - 90 };

      const flights: BallFlight[] = [
        {
          start: deliveryStart,
          end: strikerPos,
          duration: clamp(420 / speed, 220, 480),
          startTime: performance.now(),
          easing: easeOutQuad
        }
      ];

      if (outcome.type !== "dot" && outcome.type !== "wicket") {
        flights.push({
          start: strikerPos,
          end: hitTarget,
          duration: clamp(outcome.type === "six" ? 900 / speed : 620 / speed, 380, 900),
          startTime: 0,
          easing: easeOutQuad
        });
      } else if (outcome.type === "wicket") {
        flights.push({
          start: strikerPos,
          end: { x: strikerPos.x - 12, y: strikerPos.y - 60 },
          duration: clamp(520 / speed, 280, 600),
          startTime: 0,
          easing: easeOutQuad
        });
      }

      flights.push({
        start:
          flights.length > 1
            ? flights[flights.length - 1].end
            : { x: strikerPos.x, y: strikerPos.y },
        end: { x: batsmanPosition.bowler.x, y: batsmanPosition.bowler.y + 20 },
        duration: clamp(520 / speed, 280, 640),
        startTime: 0,
        easing: easeOutQuad
      });

      const now = performance.now();
      flights.forEach((flight, index) => {
        flight.startTime = index === 0 ? now : 0;
      });

      queueBallFlight(flights);
    },
    [batsmanPosition, queueBallFlight, speed]
  );

  const swapStrike = (state: InternalState) => {
    const prevStriker = state.strikerIndex;
    state.strikerIndex = state.nonStrikerIndex;
    state.nonStrikerIndex = prevStriker;
  };

  const selectNextBowler = (state: InternalState) => {
    const bowlingTeam = teamsMemo[state.bowlingTeamIndex];
    const totalBowlers = bowlingTeam.lineup.length;
    state.bowlerIndex = (state.bowlerIndex + 1) % totalBowlers;
    if (state.bowlerIndex < 5) {
      state.bowlerIndex = 6;
    }
  };

  const callNextBatter = (state: InternalState) => {
    const battingTeam = teamsMemo[state.battingTeamIndex];
    if (state.nextBatterIndex >= battingTeam.lineup.length) {
      return false;
    }
    const nextIndex = state.nextBatterIndex;
    state.battingScorecard[nextIndex].out = false;
    state.strikerIndex = nextIndex;
    state.nextBatterIndex += 1;
    return true;
  };

  const concludeInnings = (state: InternalState) => {
    if (state.innings === 1) {
      state.firstInningsRuns = state.runs;
      state.firstInningsWickets = state.wickets;
      state.firstInningsBalls = state.balls;
      state.target = state.runs + 1;
      state.commentary.push(
        `End of innings: ${teamsMemo[state.battingTeamIndex].shortName} posted ${state.runs}/${state.wickets} in ${formatOvers(
          state.balls
        )} overs.`
      );
      const newState: InternalState = {
        ...state,
        innings: 2,
        battingTeamIndex: state.bowlingTeamIndex,
        bowlingTeamIndex: state.battingTeamIndex,
        strikerIndex: 0,
        nonStrikerIndex: 1,
        nextBatterIndex: 2,
        bowlerIndex: 6,
        runs: 0,
        wickets: 0,
        balls: 0,
        wides: 0,
        legByes: 0,
        byes: 0,
        currentOverSymbols: [],
        battingScorecard: teamsMemo[state.bowlingTeamIndex].lineup.map((player, index) => ({
          name: player.name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          out: index >= 2
        })),
        bowlingScorecard: teamsMemo[state.battingTeamIndex].lineup.map((player) => ({
          name: player.name,
          balls: 0,
          runs: 0,
          wickets: 0
        })),
        commentary: state.commentary.slice(-8),
        isComplete: false
      };
      newState.battingScorecard[0].out = false;
      newState.battingScorecard[1].out = false;
      gameStateRef.current = newState;
    } else {
      state.isComplete = true;
      const chasingTeam = teamsMemo[state.battingTeamIndex];
      const defendingTeam = teamsMemo[state.bowlingTeamIndex];
      const target = state.target ?? 0;
      if (state.runs >= target) {
        state.result = `${chasingTeam.shortName} win by ${
          10 - state.wickets
        } wickets with ${formatOvers(maxOvers * 6 - state.balls)} overs remaining.`;
      } else {
        const margin = target - 1 - state.runs;
        state.result = `${defendingTeam.shortName} defend successfully by ${margin} runs.`;
      }
      state.commentary.push(state.result);
    }
  };

  const applyOutcome = useCallback(
    (outcome: OutcomeDefinition) => {
      const state = gameStateRef.current;
      if (state.isComplete) return;

      const battingTeam = teamsMemo[state.battingTeamIndex];
      const bowlingTeam = teamsMemo[state.bowlingTeamIndex];
      const striker = state.battingScorecard[state.strikerIndex];
      const bowler = state.bowlingScorecard[state.bowlerIndex];

      const description = `${bowlingTeam.shortName} vs ${battingTeam.shortName}: ${outcome.description}`;

      if (outcome.type === "wide") {
        state.runs += 1;
        state.wides += 1;
        bowler.runs += 1;
        state.currentOverSymbols.push(outcome.symbol);
        state.commentary.push(`${description} Wide called.`);
        broadcastSnapshot(state);
        return;
      }

      state.balls += 1;
      bowler.balls += 1;
      state.currentOverSymbols.push(outcome.symbol);

      const battingRuns = outcome.type === "bye" || outcome.type === "legBye" ? 0 : outcome.runs;
      const extraRuns = outcome.type === "bye" || outcome.type === "legBye" ? outcome.runs : 0;

      state.runs += battingRuns + extraRuns;
      bowler.runs += battingRuns + extraRuns;

      if (outcome.type === "bye") {
        state.byes += outcome.runs;
      }
      if (outcome.type === "legBye") {
        state.legByes += outcome.runs;
      }

      striker.balls += 1;

      if (battingRuns > 0) {
        striker.runs += battingRuns;
        if (battingRuns === 4) striker.fours += 1;
        if (battingRuns === 6) striker.sixes += 1;
      }

      if (outcome.type === "wicket") {
        bowler.wickets += 1;
        striker.out = true;
        state.wickets += 1;
        state.commentary.push(
          `${description} ${striker.name} departs for ${striker.runs} (${striker.balls}).`
        );
        if (!callNextBatter(state)) {
          state.commentary.push("All out!");
          concludeInnings(state);
          broadcastSnapshot(gameStateRef.current);
          return;
        }
      } else {
        if (outcome.runs % 2 === 1) {
          swapStrike(state);
        }
        if (outcome.type === "bye" || outcome.type === "legBye") {
          if (outcome.runs % 2 === 1) {
            swapStrike(state);
          }
        }
        if (outcome.runs >= 3) {
          swapStrike(state);
        }
        if (outcome.runs > 0) {
          state.commentary.push(
            `${description} ${striker.name} moves to ${striker.runs} off ${striker.balls}.`
          );
        } else {
          state.commentary.push(`${description} ${striker.name} stays on ${striker.runs}.`);
        }
      }

      if (state.runs >= (state.target ?? Number.MAX_SAFE_INTEGER) && state.innings === 2) {
        concludeInnings(state);
        broadcastSnapshot(state);
        return;
      }

      if (state.balls % 6 === 0) {
        state.commentary.push(
          `End of over ${state.balls / 6}: ${battingTeam.shortName} ${state.runs}/${state.wickets}`
        );
        selectNextBowler(state);
        swapStrike(state);
        state.currentOverSymbols = [];
      }

      if (state.balls >= maxOvers * 6) {
        concludeInnings(state);
      }

      broadcastSnapshot(gameStateRef.current);
    },
    [broadcastSnapshot, maxOvers, teamsMemo]
  );

  const stepGame = useCallback(() => {
    const state = gameStateRef.current;
    if (state.isComplete) {
      setIsRunning(false);
      return;
    }
    const outcome = rollOutcome();
    triggerBallAnimation(outcome);
    applyOutcome(outcome);
  }, [applyOutcome, triggerBallAnimation, rollOutcome]);

  useEffect(() => {
    broadcastSnapshot(gameStateRef.current);
    const render = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const delta = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      if (isRunning && timestamp - lastBallRef.current > BASE_DELIVERY_INTERVAL / speed) {
        lastBallRef.current = timestamp;
        stepGame();
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(width / 2, height / 2, 60, width / 2, height / 2, 360);
      gradient.addColorStop(0, "#14532d");
      gradient.addColorStop(1, "#052e16");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#0b3521";
      ctx.fillRect(width / 2 - 18, height / 2 - 120, 36, 240);

      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 180, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.ellipse(width / 2, height / 2, 260, 180, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const state = gameStateRef.current;
      const battingTeam = teamsMemo[state.battingTeamIndex];
      const bowlingTeam = teamsMemo[state.bowlingTeamIndex];

      const drawPlayer = (pos: { x: number; y: number }, color: string, label?: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
        ctx.fill();
        if (label) {
          ctx.font = "10px 'Inter', sans-serif";
          ctx.fillStyle = "rgba(15,23,42,0.9)";
          ctx.textAlign = "center";
          ctx.fillText(label, pos.x, pos.y + 3);
        }
      };

      const fielders = [
        { x: width / 2 - 210, y: height / 2 - 110 },
        { x: width / 2 + 210, y: height / 2 + 80 },
        { x: width / 2 - 160, y: height / 2 + 120 },
        { x: width / 2 + 140, y: height / 2 - 150 },
        { x: width / 2 - 60, y: height / 2 - 200 },
        { x: width / 2 + 60, y: height / 2 + 200 },
        { x: width / 2 - 220, y: height / 2 + 20 },
        { x: width / 2 + 220, y: height / 2 - 40 }
      ];

      fielders.forEach((pos, idx) => {
        drawPlayer(pos, `${bowlingTeam.secondaryColor}dd`, `${idx + 1}`);
      });

      drawPlayer(batsmanPosition.striker, battingTeam.primaryColor, "S");
      drawPlayer(batsmanPosition.nonStriker, battingTeam.primaryColor, "NS");
      drawPlayer(batsmanPosition.bowler, bowlingTeam.primaryColor, "B");
      drawPlayer(batsmanPosition.keeper, bowlingTeam.primaryColor, "K");

      const now = timestamp;
      let ballPosition = { x: batsmanPosition.bowler.x, y: batsmanPosition.bowler.y + 20 };
      const flight = ballFlightRef.current;
      if (flight) {
        if (flight.startTime === 0) {
          flight.startTime = now;
        }
        const progress = clamp((now - flight.startTime) / flight.duration, 0, 1);
        const eased = flight.easing(progress);
        ballPosition = {
          x: flight.start.x + (flight.end.x - flight.start.x) * eased,
          y: flight.start.y + (flight.end.y - flight.start.y) * eased
        };
        if (progress >= 1) {
          ballFlightRef.current = flight.next ?? null;
          if (ballFlightRef.current) {
            ballFlightRef.current.startTime = now;
          }
        }
      }

      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(ballPosition.x, ballPosition.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "12px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(248,250,252,0.8)";
      ctx.fillText(`Innings ${state.innings}`, width / 2, 20);
      ctx.fillText(`${battingTeam.shortName} vs ${bowlingTeam.shortName}`, width / 2, height - 16);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [broadcastSnapshot, isRunning, speed, stepGame, teamsMemo, batsmanPosition]);

  const handleStart = () => {
    const state = gameStateRef.current;
    if (state.isComplete) {
      resetGame();
      setIsRunning(true);
      return;
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    resetGame();
  };

  return (
    <div className="card canvas-shell" style={{ gridColumn: "span 2" }}>
      <div className="canvas-controls">
        <button className="btn" onClick={handleStart}>
          {snapshot?.result ? "Restart Match" : isRunning ? "Resume" : "Start Match"}
        </button>
        <button className="btn secondary" onClick={handlePause} disabled={!isRunning}>
          Pause
        </button>
        <button className="btn secondary" onClick={handleReset}>
          Reset
        </button>
      </div>
      <canvas ref={canvasRef} width={720} height={400} style={{ width: "100%", borderRadius: 14 }} />
      {snapshot && (
        <div className="simulation-overlay">
          <div className="overlay-panel">
            <h4>Score</h4>
            <div className="overlay-row">
              <span>{snapshot.battingTeam}</span>
              <strong>
                {snapshot.runs}/{snapshot.wickets}
              </strong>
            </div>
            <div className="overlay-row">
              <span>Overs</span>
              <strong>{snapshot.overs}</strong>
            </div>
            {snapshot.target && (
              <div className="overlay-row">
                <span>Target</span>
                <strong>{snapshot.target}</strong>
              </div>
            )}
            <div className="overlay-row">
              <span>Run Rate</span>
              <strong>{snapshot.runRate.toFixed(2)}</strong>
            </div>
            {snapshot.requiredRunRate && !Number.isNaN(snapshot.requiredRunRate) && (
              <div className="overlay-row">
                <span>Required</span>
                <strong>{snapshot.requiredRunRate.toFixed(2)}</strong>
              </div>
            )}
            <div className="overlay-row">
              <span>Over Summary</span>
              <strong>{snapshot.currentOverSymbols.join(" ") || "—"}</strong>
            </div>
          </div>
          <div className="overlay-panel">
            <h4>Batting</h4>
            {snapshot.striker && (
              <div className="overlay-row">
                <span>
                  {snapshot.striker.name} *
                  <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                    {snapshot.striker.balls}b
                  </span>
                </span>
                <strong>{snapshot.striker.runs}</strong>
              </div>
            )}
            {snapshot.nonStriker && (
              <div className="overlay-row">
                <span>
                  {snapshot.nonStriker.name}
                  <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                    {snapshot.nonStriker.balls}b
                  </span>
                </span>
                <strong>{snapshot.nonStriker.runs}</strong>
              </div>
            )}
            <div className="progress">
              <div
                className="progress-bar"
                style={{
                  width: `${clamp((snapshot.runs / ((snapshot.target ?? snapshot.runs + 40) || 1)) * 100, 5, 100)}%`
                }}
              />
            </div>
          </div>
          <div className="overlay-panel">
            <h4>Bowling</h4>
            {snapshot.bowler ? (
              <>
                <div className="overlay-row">
                  <span>{snapshot.bowler.name}</span>
                  <strong>
                    {snapshot.bowler.wickets}/{snapshot.bowler.runs} ({snapshot.bowler.overs})
                  </strong>
                </div>
              </>
            ) : (
              <div className="overlay-row">
                <span>Loading spell</span>
              </div>
            )}
            <div className="overlay-row" style={{ marginTop: 10, color: "var(--text-muted)" }}>
              <span>Commentary</span>
            </div>
            {snapshot.commentary.map((line, index) => (
              <div key={`${line}-${index}`} className="overlay-row" style={{ fontSize: 12 }}>
                <span style={{ color: "var(--text-muted)", textAlign: "left" }}>{line}</span>
              </div>
            ))}
            {snapshot.result && (
              <div className="overlay-row" style={{ marginTop: 8, color: "var(--success)", fontWeight: 600 }}>
                <span>{snapshot.result}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SimulationCanvas;
