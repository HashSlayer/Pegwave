/**
 * Pegwave field — canvas physics, peg rack, LFO sway, collision → audio + gain.
 * Simulation loop and React HUD live here; domain logic is in sibling .ts modules.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { ScaleName, Waveform, QuantizeConfig } from '../audio/noteCore.ts';
import { collisionToNote } from '../audio/noteCore.ts';
import { playNote, resumeAudio } from '../audio/synth.ts';
import type { LFOControlParams, PegwaveRunState } from './runState.ts';
import {
  recordDrop,
  updateLfo,
  withSectionGain,
} from './runState.ts';
import { collisionScoresGain, pegRowScoresGain, waveformScoresGain } from './faults.ts';
import { faultDescription, sectionDefFor } from './sections.ts';
import { lfoValue } from './lfo.ts';
import { RackPanel, type RackTab } from './RackPanel.tsx';
import type { PegKind } from './pegs/pegCatalog.ts';
import { getPegDefinition } from './pegs/pegCatalog.ts';
import { getPlanetPlinko, type PlanetId } from './planetPlinko.ts';
import { getVoiceCoin } from './coins/voiceCatalog.ts';

const BOARD_W = 460;
const BOARD_H = 640;
const PEG_ROWS = 9;
const PEG_RADIUS = 7;
const COIN_RADIUS = 9;
const SWAY_PX = 26;
const GRAVITY = 1500;
const RESTITUTION = 0.72;
const SUBSTEPS = 4;

const MIN_PEG_SPACING = 22;

interface Peg {
  readonly id: number;
  readonly defId: string;
  readonly kind: PegKind;
  readonly planetId?: PlanetId;
  readonly color: string;
  readonly restitution: number;
  readonly placed: boolean;
  readonly bx: number;
  readonly y: number;
  readonly row: number;
  readonly rowFraction: number;
  lx: number;
  hitAt: number;
}

interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  combo: number;
  alive: boolean;
  mass: number;
  restitutionScale: number;
  color: string;
}

interface Sim {
  readonly pegs: Peg[];
  coins: Coin[];
  t: number;
  gain: number;
}

interface Hud {
  readonly gain: number;
  readonly drops: number;
  readonly coins: number;
  readonly cleared: boolean;
  readonly track: number;
  readonly sectionName: string;
  readonly threshold: number;
  readonly dropsLeft: number;
  readonly waveformScores: boolean;
}

const ROOT_OPTIONS: ReadonlyArray<{ label: string; midi: number }> = [
  { label: 'C', midi: 48 },
  { label: 'D', midi: 50 },
  { label: 'E', midi: 52 },
  { label: 'F', midi: 53 },
  { label: 'G', midi: 55 },
  { label: 'A', midi: 57 },
];

const SCALE_OPTIONS: ReadonlyArray<ScaleName> = [
  'minorPenta',
  'majorPenta',
  'minor',
  'major',
  'chromatic',
];

const WAVEFORMS: ReadonlyArray<Waveform> = ['sine', 'saw', 'square', 'tri'];

function buildPegs(): Peg[] {
  const pegs: Peg[] = [];
  const marginX = 50;
  const usableW = BOARD_W - marginX * 2;
  const topY = 120;
  const rowGap = (BOARD_H - topY - 90) / (PEG_ROWS - 1);

  for (let row = 0; row < PEG_ROWS; row++) {
    const cols = row % 2 === 0 ? 6 : 5;
    const colGap = usableW / (cols - 1 + (row % 2 === 0 ? 0 : 0));
    const rowOffset = row % 2 === 0 ? 0 : colGap / 2;
    for (let col = 0; col < cols; col++) {
      const bx = marginX + rowOffset + col * (usableW / (cols - 1));
      pegs.push({
        id: pegs.length,
        defId: row % 2 === 0 ? 'peg-tone-root' : 'peg-tone-fifth',
        kind: 'tone',
        color: '#3b6ea5',
        restitution: RESTITUTION,
        placed: false,
        bx: Math.min(BOARD_W - marginX, bx),
        y: topY + row * rowGap,
        row,
        rowFraction: row / PEG_ROWS,
        lx: bx,
        hitAt: -1,
      });
    }
  }
  return pegs;
}

function createSim(sectionGain: number): Sim {
  return { pegs: buildPegs(), coins: [], t: 0, gain: sectionGain };
}

export function GameCanvas({
  run,
  onRunChange,
  onSectionComplete,
  onExit,
}: {
  readonly run: PegwaveRunState;
  readonly onRunChange: (run: PegwaveRunState) => void;
  readonly onSectionComplete: () => void;
  readonly onExit: () => void;
}): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runRef = useRef(run);
  const simRef = useRef<Sim>(createSim(run.sectionGain));
  const paramsRef = useRef<LFOControlParams>(run.lfo);
  const hudRef = useRef<Hud>({
    gain: run.sectionGain,
    drops: run.dropsUsed,
    coins: 0,
    cleared: run.sectionGain >= run.resonanceThreshold,
    track: run.track,
    sectionName: sectionDefFor(run.sectionSlot).name,
    threshold: run.resonanceThreshold,
    dropsLeft: run.dropsRemaining,
    waveformScores: waveformScoresGain(run.fault, run.lfo.waveform),
  });

  const [params, setParams] = useState<LFOControlParams>(run.lfo);
  const [hud, setHud] = useState<Hud>(hudRef.current);
  const [rackTab, setRackTab] = useState<RackTab>('pegs');
  const [selectedPegId, setSelectedPegId] = useState<string | null>(null);
  const [selectedCoinId, setSelectedCoinId] = useState('voice-standard');
  const [placedPegCount, setPlacedPegCount] = useState(0);

  const nextPegIdRef = useRef(simRef.current.pegs.length);
  const rackTabRef = useRef(rackTab);
  const selectedPegIdRef = useRef(selectedPegId);
  const selectedCoinIdRef = useRef(selectedCoinId);

  useEffect(() => {
    rackTabRef.current = rackTab;
  }, [rackTab]);

  useEffect(() => {
    selectedPegIdRef.current = selectedPegId;
  }, [selectedPegId]);

  useEffect(() => {
    selectedCoinIdRef.current = selectedCoinId;
  }, [selectedCoinId]);

  useEffect(() => {
    runRef.current = run;
    simRef.current.gain = run.sectionGain;
    paramsRef.current = run.lfo;
    setParams(run.lfo);
  }, [run]);

  const dropCoin = useCallback((): void => {
    if (runRef.current.dropsRemaining <= 0) {
      return;
    }
    resumeAudio();
    const voice = getVoiceCoin(selectedCoinIdRef.current);
    const jitter = (Math.random() - 0.5) * 40;
    simRef.current.coins.push({
      x: BOARD_W / 2 + jitter,
      y: 30,
      vx: (Math.random() - 0.5) * 30,
      vy: 0,
      combo: 0,
      alive: true,
      mass: voice.mass,
      restitutionScale: voice.restitutionScale,
      color: voice.color,
    });
    const nextRun = recordDrop(runRef.current);
    runRef.current = nextRun;
    onRunChange(nextRun);
  }, [onRunChange]);

  const placePegAt = useCallback((x: number, y: number): void => {
    if (rackTabRef.current !== 'pegs' || selectedPegIdRef.current === null) {
      return;
    }
    const def = getPegDefinition(selectedPegIdRef.current);
    if (def === undefined) {
      return;
    }
    if (x < PEG_RADIUS + 8 || x > BOARD_W - PEG_RADIUS - 8) {
      return;
    }
    if (y < 90 || y > BOARD_H - 50) {
      return;
    }
    const tooClose = simRef.current.pegs.some(
      (p) => Math.hypot(p.lx - x, p.y - y) < MIN_PEG_SPACING,
    );
    if (tooClose) {
      return;
    }
    const id = nextPegIdRef.current;
    nextPegIdRef.current += 1;
    simRef.current.pegs.push({
      id,
      defId: def.id,
      kind: def.kind,
      ...(def.planetId !== undefined ? { planetId: def.planetId } : {}),
      color: def.color,
      restitution: def.restitution ?? RESTITUTION,
      placed: true,
      bx: x,
      y,
      row: Math.floor((y / BOARD_H) * PEG_ROWS),
      rowFraction: y / BOARD_H,
      lx: x,
      hitAt: -1,
    });
    setPlacedPegCount((n) => n + 1);
    resumeAudio();
  }, []);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      if (canvas === null) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * BOARD_W;
      const y = ((event.clientY - rect.top) / rect.height) * BOARD_H;
      placePegAt(x, y);
    },
    [placePegAt],
  );

  const advanceSection = useCallback((): void => {
    onSectionComplete();
  }, [onSectionComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      return;
    }

    let raf = 0;
    let last = 0;

    const quantize = (): QuantizeConfig => {
      const p = paramsRef.current;
      return {
        rootMidi: p.rootMidi,
        scale: p.scale,
        octaves: 3,
        bpm: p.bpm,
        subdivision: 4,
      };
    };

    const stepPhysics = (dt: number): void => {
      const sim = simRef.current;
      const p = paramsRef.current;
      sim.t += dt;

      for (const peg of sim.pegs) {
        peg.lx =
          peg.bx +
          lfoValue(
            { rate: p.rate, depth: p.depth, waveform: p.waveform, phase: peg.rowFraction * 0.5 },
            sim.t,
          ) *
            SWAY_PX;
      }

      const cfg = quantize();
      const sub = dt / SUBSTEPS;

      for (const coin of sim.coins) {
        for (let s = 0; s < SUBSTEPS; s++) {
          coin.vy += GRAVITY * sub;
          coin.x += coin.vx * sub;
          coin.y += coin.vy * sub;

          if (coin.x < COIN_RADIUS) {
            coin.x = COIN_RADIUS;
            coin.vx = Math.abs(coin.vx) * 0.8;
          } else if (coin.x > BOARD_W - COIN_RADIUS) {
            coin.x = BOARD_W - COIN_RADIUS;
            coin.vx = -Math.abs(coin.vx) * 0.8;
          }

          for (const peg of sim.pegs) {
            const dx = coin.x - peg.lx;
            const dy = coin.y - peg.y;
            const dist = Math.hypot(dx, dy);
            const minDist = COIN_RADIUS + PEG_RADIUS;
            if (dist < minDist && dist > 0.0001) {
              const nx = dx / dist;
              const ny = dy / dist;
              coin.x = peg.lx + nx * minDist;
              coin.y = peg.y + ny * minDist;
              const vdot = coin.vx * nx + coin.vy * ny;
              const rest = peg.restitution * coin.restitutionScale;
              coin.vx -= (1 + rest) * vdot * nx;
              coin.vy -= (1 + rest) * vdot * ny;

              const impact = Math.abs(vdot) * coin.mass;
              if (impact > 45 && sim.t - peg.hitAt > 0.05) {
                const beatPhase = (sim.t * (cfg.bpm / 60)) % 1;
                const onGrid = beatPhase < 0.12 || beatPhase > 0.88;
                if (peg.kind === 'gate' && !onGrid) {
                  continue;
                }

                peg.hitAt = sim.t;
                const note = collisionToNote(
                  {
                    pegId: peg.id,
                    x: peg.lx / BOARD_W,
                    y: peg.y / BOARD_H,
                    velocity: Math.min(1, impact / 700),
                    time: sim.t,
                  },
                  cfg,
                );
                const reverb =
                  peg.kind === 'planetPlinko' && peg.planetId !== undefined
                    ? getPlanetPlinko(peg.planetId).reverb
                    : undefined;
                playNote(note, p.waveform, 0.16, reverb);
                coin.combo += 1;
                const scores = collisionScoresGain(
                  runRef.current.fault,
                  peg.row,
                  p.waveform,
                );
                if (scores) {
                  sim.gain += note.velocity * (1 + coin.combo * 0.18);
                }
              }
            }
          }
        }

        if (coin.y > BOARD_H + COIN_RADIUS * 2) {
          coin.alive = false;
        }
      }

      sim.coins = sim.coins.filter((c) => c.alive);

      if (sim.gain !== runRef.current.sectionGain) {
        const nextRun = withSectionGain(runRef.current, sim.gain);
        runRef.current = nextRun;
        onRunChange(nextRun);
      }
    };

    const draw = (): void => {
      const sim = simRef.current;
      const p = paramsRef.current;
      const threshold = runRef.current.resonanceThreshold;

      ctx.fillStyle = '#0c0f17';
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);

      ctx.strokeStyle = '#23304d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.lineTo(BOARD_W, 100);
      ctx.stroke();

      for (const peg of sim.pegs) {
        const recent = sim.t - peg.hitAt;
        const lit = recent >= 0 && recent < 0.18;
        const fault = runRef.current.fault;
        const rowScores = pegRowScoresGain(fault, peg.row);
        ctx.beginPath();
        ctx.arc(peg.lx, peg.y, lit ? PEG_RADIUS + 3 : PEG_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = lit ? '#7cf2c8' : rowScores ? peg.color : '#2a3344';
        ctx.fill();
        if (peg.placed) {
          ctx.strokeStyle = '#ffffff44';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        if (peg.kind === 'planetPlinko') {
          ctx.beginPath();
          ctx.arc(peg.lx, peg.y, PEG_RADIUS + 5, 0, Math.PI * 2);
          ctx.strokeStyle = peg.color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      for (const coin of sim.coins) {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, COIN_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = coin.color;
        ctx.fill();
      }

      const ratio = Math.min(1, sim.gain / threshold);
      ctx.fillStyle = '#1a2233';
      ctx.fillRect(8, 110, 10, BOARD_H - 200);
      ctx.fillStyle = ratio >= 1 ? '#7cf2c8' : '#ffd166';
      const meterH = (BOARD_H - 200) * ratio;
      ctx.fillRect(8, 110 + (BOARD_H - 200) - meterH, 10, meterH);

      ctx.fillStyle = '#56607a';
      ctx.font = '11px monospace';
      ctx.fillText(
        `T${runRef.current.track} ${sectionDefFor(runRef.current.sectionSlot).name}  ${p.waveform} ${p.rate.toFixed(1)}Hz`,
        26,
        122,
      );
    };

    const syncHud = (): void => {
      const sim = simRef.current;
      const r = runRef.current;
      const next: Hud = {
        gain: Math.floor(sim.gain),
        drops: r.dropsUsed,
        coins: sim.coins.length,
        cleared: sim.gain >= r.resonanceThreshold,
        track: r.track,
        sectionName: sectionDefFor(r.sectionSlot).name,
        threshold: r.resonanceThreshold,
        dropsLeft: r.dropsRemaining,
        waveformScores: waveformScoresGain(r.fault, paramsRef.current.waveform),
      };
      const prev = hudRef.current;
      if (
        next.gain !== prev.gain ||
        next.drops !== prev.drops ||
        next.coins !== prev.coins ||
        next.cleared !== prev.cleared ||
        next.track !== prev.track ||
        next.dropsLeft !== prev.dropsLeft ||
        next.waveformScores !== prev.waveformScores
      ) {
        hudRef.current = next;
        setHud(next);
      }
    };

    const loop = (now: number): void => {
      const dt = last === 0 ? 0 : Math.min(0.032, (now - last) / 1000);
      last = now;
      stepPhysics(dt);
      draw();
      syncHud();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return (): void => {
      window.cancelAnimationFrame(raf);
    };
  }, [onRunChange]);

  const updateParam = useCallback(
    <K extends keyof LFOControlParams>(key: K, value: LFOControlParams[K]): void => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        paramsRef.current = next;
        const nextRun = updateLfo(runRef.current, next);
        runRef.current = nextRun;
        onRunChange(nextRun);
        return next;
      });
    },
    [onRunChange],
  );

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const canDrop = hud.dropsLeft > 0;

  return (
    <div className="flex flex-row items-start justify-center gap-8 min-h-screen p-6 text-gray-100">
      <div className="flex flex-col items-center gap-3">
        <canvas
          id="pegwave-game-canvas"
          ref={canvasRef}
          width={BOARD_W}
          height={BOARD_H}
          aria-label="Pegwave game canvas"
          onClick={handleCanvasClick}
          className={`rounded-lg border border-gray-700 ${
            rackTab === 'pegs' && selectedPegId !== null ? 'cursor-crosshair' : ''
          }`}
        />
        <div className="flex gap-3">
          <button
            onClick={dropCoin}
            disabled={!canDrop}
            className={`px-8 py-3 font-semibold rounded transition-colors ${
              canDrop
                ? 'bg-amber-500 hover:bg-amber-400 text-gray-900'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Drop Voice
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 w-72">
        <div>
          <button
            onClick={onExit}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            ← Menu
          </button>
          <h1 className="text-3xl mt-2">Pegwave</h1>
          <p className="text-sm text-gray-400">
            Track {hud.track} · {hud.sectionName}
          </p>
        </div>

        {run.fault !== null && (
          <div className="text-xs px-3 py-2 bg-red-950 border border-red-800 rounded text-red-200">
            {faultDescription(run.fault)}
          </div>
        )}

        {!hud.waveformScores && run.fault !== null && (
          <div className="text-xs px-3 py-2 bg-amber-950 border border-amber-800 rounded text-amber-200">
            Current waveform scores no resonance — switch LFO shape.
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Gain" value={hud.gain.toString()} />
          <Stat label="Resonance" value={hud.threshold.toString()} />
          <Stat label="Drops left" value={hud.dropsLeft.toString()} />
        </div>

        <RackPanel
          tab={rackTab}
          onTabChange={setRackTab}
          selectedPegId={selectedPegId}
          onSelectPeg={setSelectedPegId}
          selectedCoinId={selectedCoinId}
          onSelectCoin={setSelectedCoinId}
          placedPegCount={placedPegCount}
        />

        {hud.cleared && (
          <div className="flex flex-col gap-2 items-center">
            <div className="text-emerald-400 font-semibold text-center">
              Section cleared
            </div>
            <button
              onClick={advanceSection}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded text-sm"
            >
              Section cleared →
            </button>
          </div>
        )}

        <Control label="Waveform">
          <div className="flex gap-2 flex-wrap">
            {WAVEFORMS.map((w) => (
              <Toggle
                key={w}
                active={params.waveform === w}
                onClick={() => updateParam('waveform', w)}
              >
                {w}
              </Toggle>
            ))}
          </div>
        </Control>

        <Control label={`Rate — ${params.rate.toFixed(1)} Hz`}>
          <input
            type="range"
            min={0.1}
            max={12}
            step={0.1}
            value={params.rate}
            onChange={(e) => updateParam('rate', parseFloat(e.target.value))}
            className="w-full"
          />
        </Control>

        <Control label={`Depth — ${Math.round(params.depth * 100)}%`}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={params.depth}
            onChange={(e) => updateParam('depth', parseFloat(e.target.value))}
            className="w-full"
          />
        </Control>

        <Control label={`Tempo — ${params.bpm} BPM`}>
          <input
            type="range"
            min={60}
            max={180}
            step={1}
            value={params.bpm}
            onChange={(e) => updateParam('bpm', parseFloat(e.target.value))}
            className="w-full"
          />
        </Control>

        <Control label="Key">
          <div className="flex gap-2 flex-wrap">
            {ROOT_OPTIONS.map((r) => (
              <Toggle
                key={r.midi}
                active={params.rootMidi === r.midi}
                onClick={() => updateParam('rootMidi', r.midi)}
              >
                {r.label}
              </Toggle>
            ))}
          </div>
        </Control>

        <Control label="Scale">
          <div className="flex gap-2 flex-wrap">
            {SCALE_OPTIONS.map((s) => (
              <Toggle
                key={s}
                active={params.scale === s}
                onClick={() => updateParam('scale', s)}
              >
                {s}
              </Toggle>
            ))}
          </div>
        </Control>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): React.ReactElement {
  return (
    <div className="bg-gray-800 rounded px-2 py-2">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function Control({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-gray-300">{label}</div>
      {children}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded text-sm transition-colors ${
        active
          ? 'bg-emerald-500 text-gray-900'
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
}
