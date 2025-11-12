"use client";

import { useMemo, useState } from "react";
import SimulationCanvas, {
  SimulationSnapshot,
  TeamProfile
} from "@/components/SimulationCanvas";

type TabId =
  | "home"
  | "fixtures"
  | "standings"
  | "records"
  | "stats"
  | "lineups"
  | "squad"
  | "editor"
  | "settings";

const tabs: { id: TabId; label: string; accent: string }[] = [
  { id: "home", label: "Home", accent: "🏠" },
  { id: "fixtures", label: "Fixtures", accent: "📅" },
  { id: "standings", label: "Standings", accent: "📊" },
  { id: "records", label: "Records", accent: "🏆" },
  { id: "stats", label: "Advanced Stats", accent: "📈" },
  { id: "lineups", label: "Lineups", accent: "🧾" },
  { id: "squad", label: "Squad Hub", accent: "🧠" },
  { id: "editor", label: "Editor", accent: "🛠️" },
  { id: "settings", label: "Settings", accent: "⚙️" }
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const initialTeams: TeamProfile[] = [
  {
    id: "aurora_strikers",
    name: "Aurora Strikers",
    shortName: "AUS",
    coach: "Mira Solanki",
    captain: "Rafael DaCosta",
    formation: "3-2-3 Hyperloop",
    primaryColor: "#38bdf8",
    secondaryColor: "#0ea5e9",
    lineup: [
      { name: "Rafael DaCosta", role: "Batter", batting: 88, bowling: 38, stamina: 82 },
      { name: "Ishan Pillai", role: "Batter", batting: 82, bowling: 42, stamina: 78 },
      { name: "Mira Solanki", role: "All-Rounder", batting: 80, bowling: 72, stamina: 86 },
      { name: "Leo Hartmann", role: "Batter", batting: 79, bowling: 30, stamina: 75 },
      { name: "Quinn Faraday", role: "Batter", batting: 76, bowling: 26, stamina: 74 },
      { name: "Nikhil Aurora", role: "All-Rounder", batting: 74, bowling: 68, stamina: 84 },
      { name: "Hasan Qureshi", role: "All-Rounder", batting: 70, bowling: 76, stamina: 83 },
      { name: "Jonah Teague", role: "Bowler", batting: 32, bowling: 84, stamina: 88 },
      { name: "Felix Beaumont", role: "Bowler", batting: 30, bowling: 82, stamina: 85 },
      { name: "Keiji Nakamura", role: "Bowler", batting: 28, bowling: 86, stamina: 80 },
      { name: "Theo Laurent", role: "Keeper", batting: 68, bowling: 36, stamina: 70 }
    ]
  },
  {
    id: "titan_guardians",
    name: "Titan Guardians",
    shortName: "TIG",
    coach: "Rahul Menon",
    captain: "Elliot Kane",
    formation: "2-3-3 Resonance",
    primaryColor: "#f97316",
    secondaryColor: "#fb923c",
    lineup: [
      { name: "Elliot Kane", role: "Batter", batting: 86, bowling: 34, stamina: 80 },
      { name: "Zhang Wei", role: "Batter", batting: 81, bowling: 42, stamina: 79 },
      { name: "Priya Venkataraman", role: "All-Rounder", batting: 78, bowling: 74, stamina: 88 },
      { name: "Jon Reyes", role: "Batter", batting: 75, bowling: 32, stamina: 74 },
      { name: "Santiago Alvarez", role: "All-Rounder", batting: 72, bowling: 70, stamina: 82 },
      { name: "Noah Sinclair", role: "All-Rounder", batting: 68, bowling: 77, stamina: 80 },
      { name: "Farhan Idrisi", role: "Keeper", batting: 66, bowling: 30, stamina: 72 },
      { name: "Amir El-Masri", role: "Bowler", batting: 28, bowling: 86, stamina: 84 },
      { name: "Joel Petersen", role: "Bowler", batting: 25, bowling: 83, stamina: 85 },
      { name: "Max Hofstad", role: "Bowler", batting: 24, bowling: 88, stamina: 83 },
      { name: "Teo Marquez", role: "Bowler", batting: 22, bowling: 82, stamina: 81 }
    ]
  }
];

const baseFixtures = [
  {
    id: 1,
    homeIdx: 0,
    awayIdx: 1,
    date: "Apr 02, 2026",
    venue: "Orbital Dome, Neo-Wellington",
    surface: "Hybrid Turf",
    stage: "League",
    broadcast: "StreamWorld 4K"
  },
  {
    id: 2,
    homeIdx: 1,
    awayIdx: 0,
    date: "Apr 08, 2026",
    venue: "Titanium Coliseum, Jakarta",
    surface: "Responsive Deck",
    stage: "League",
    broadcast: "VividCast Prime"
  },
  {
    id: 3,
    homeIdx: 0,
    awayIdx: 1,
    date: "Apr 16, 2026",
    venue: "Aurora Belt Stadium, Reykjavík",
    surface: "Sub-Zero Blend",
    stage: "League",
    broadcast: "SkyGrid Live"
  },
  {
    id: 4,
    homeIdx: 1,
    awayIdx: 0,
    date: "Apr 24, 2026",
    venue: "Titan Guardians Arena, Nairobi",
    surface: "Dry Spin Mat",
    stage: "League",
    broadcast: "PulseView XR"
  }
];

const baseStandings = [
  { teamIdx: 0, played: 8, won: 6, lost: 2, tied: 0, nrr: 1.24, points: 12, form: ["W", "W", "L", "W", "W"] },
  { teamIdx: 1, played: 8, won: 5, lost: 3, tied: 0, nrr: 0.56, points: 10, form: ["W", "L", "W", "W", "L"] }
];

const recordBook = [
  {
    label: "Highest Team Total",
    record: "236 / 4",
    opponent: "vs Titan Guardians",
    venue: "Aurora Belt Stadium",
    season: "2025"
  },
  {
    label: "Lowest Defended Total",
    record: "142 / 9",
    opponent: "vs Aurora Strikers",
    venue: "Titanium Coliseum",
    season: "2024"
  },
  {
    label: "Best Individual Score",
    record: "126* (58)",
    player: "Rafael DaCosta",
    stage: "Championship Final",
    season: "2025"
  },
  {
    label: "Best Bowling Figures",
    record: "5 / 12",
    player: "Max Hofstad",
    opponent: "vs Aurora Strikers",
    stage: "League",
    season: "2025"
  }
];

const baseLineupNotes = [
  {
    teamIdx: 0,
    segments: [
      { title: "Powerplay Strategy", detail: "DaCosta & Pillai target mid-off arc, strike rate 142 in PP overs." },
      { title: "Middle-Order Anchor", detail: "Solanki rotates strike while Hartmann accelerates between 8-12 overs." },
      { title: "Finishing Blueprint", detail: "Aurora leans on Aurora + Qureshi pairing, 11 rpo at death." },
      { title: "Bowling Pairing", detail: "Nakamura & Teague open with knuckle slower variations every 3rd ball." }
    ]
  },
  {
    teamIdx: 1,
    segments: [
      { title: "Powerplay Strategy", detail: "Kane sweeps power lanes, Venkataraman targets leg-side pockets." },
      { title: "Middle-Order Anchor", detail: "Reyes stabilises, Alvarez ready to counter-attack wrist spin." },
      { title: "Finishing Blueprint", detail: "Sinclair unleashes switch hits, supported by Idrisi improvisation." },
      { title: "Bowling Pairing", detail: "El-Masri + Hofstad share new ball, double wobble seam in first six." }
    ]
  }
];

const benchMap: Record<string, { name: string; role: string; development: string }[]> = {
  aurora_strikers: [
    { name: "Zoe Armitage", role: "Batter", development: "Trigger step improved, SR +11 in academy" },
    { name: "Dev Patel", role: "Leg Spinner", development: "RIP revs: 2700rpm, top spin release" },
    { name: "Simon Kwan", role: "Left-Arm Medium", development: "Swing shape +0.8°, death yorker 87%" }
  ],
  titan_guardians: [
    { name: "Aiden Kerr", role: "Batter", development: "Reverse sweep perfected, PP strike +17" },
    { name: "Rahul Dhar", role: "All-Rounder", development: "Bowling workload up 18%, batting SR 132" },
    { name: "Mateo Rossi", role: "Chinaman", development: "Wrong'un success 71%, econ 6.2" }
  ]
};

const academyPipeline = [
  { label: "High-Performance Lab", success: 82, focus: "Biomechanics recalibration" },
  { label: "Mental Conditioning", success: 74, focus: "Game state awareness" },
  { label: "Analytics Sync", success: 90, focus: "Predictive matchups" }
];

const battingLeaders = [
  { player: "Rafael DaCosta", teamIdx: 0, runs: 482, strikeRate: 142.6, average: 48.2, impact: 3.6 },
  { player: "Priya Venkataraman", teamIdx: 1, runs: 451, strikeRate: 138.4, average: 41.0, impact: 3.4 },
  { player: "Ishan Pillai", teamIdx: 0, runs: 416, strikeRate: 131.2, average: 36.4, impact: 3.1 },
  { player: "Elliot Kane", teamIdx: 1, runs: 398, strikeRate: 135.1, average: 37.9, impact: 3.0 }
];

const bowlingLeaders = [
  { player: "Max Hofstad", teamIdx: 1, wickets: 21, economy: 6.3, strikeRate: 14.8, impact: 3.7 },
  { player: "Keiji Nakamura", teamIdx: 0, wickets: 19, economy: 6.5, strikeRate: 15.2, impact: 3.5 },
  { player: "Amir El-Masri", teamIdx: 1, wickets: 18, economy: 6.8, strikeRate: 15.8, impact: 3.4 },
  { player: "Jonah Teague", teamIdx: 0, wickets: 17, economy: 6.1, strikeRate: 16.4, impact: 3.2 }
];

const impactIndex = [
  { player: "Mira Solanki", teamIdx: 0, batting: 3.1, bowling: 2.8, fielding: 1.4, clutch: 92 },
  { player: "Priya Venkataraman", teamIdx: 1, batting: 3.4, bowling: 2.6, fielding: 1.2, clutch: 89 },
  { player: "Hasan Qureshi", teamIdx: 0, batting: 2.6, bowling: 2.9, fielding: 1.5, clutch: 86 },
  { player: "Noah Sinclair", teamIdx: 1, batting: 2.2, bowling: 3.1, fielding: 1.1, clutch: 84 }
];

const TabLabel = ({ label, accent }: { label: string; accent: string }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <span style={{ fontSize: 16 }}>{accent}</span>
    <span>{label}</span>
  </span>
);

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [teams, setTeams] = useState<TeamProfile[]>(initialTeams);
  const [simulationConfig, setSimulationConfig] = useState({ overs: 20, speed: 1 });
  const [liveSnapshot, setLiveSnapshot] = useState<SimulationSnapshot | null>(null);
  const [selectedSquad, setSelectedSquad] = useState<string>(initialTeams[0].id);
  const [preferences, setPreferences] = useState({
    commentaryFeed: true,
    crowdAmbience: true,
    cinematicCamera: false,
    highlightReplays: true,
    dynamicWeather: true,
    autoSave: true
  });
  const [themeIntensity, setThemeIntensity] = useState(72);

  const fixtures = useMemo(
    () =>
      baseFixtures.map((fixture) => ({
        ...fixture,
        match: `${teams[fixture.homeIdx]?.name ?? "TBD"} vs ${teams[fixture.awayIdx]?.name ?? "TBD"}`
      })),
    [teams]
  );

  const standings = useMemo(
    () =>
      baseStandings.map((row) => ({
        ...row,
        team: teams[row.teamIdx]?.name ?? "Expansion Team",
        short: teams[row.teamIdx]?.shortName ?? "EXT"
      })),
    [teams]
  );

  const lineupNotes = useMemo(
    () =>
      baseLineupNotes.map((note) => ({
        ...note,
        teamName: teams[note.teamIdx]?.name ?? "Expansion Team"
      })),
    [teams]
  );

  const benches = useMemo(
    () =>
      teams.reduce<Record<string, { name: string; role: string; development: string }[]>>(
        (acc, team) => ({
          ...acc,
          [team.id]: benchMap[team.id] ?? []
        }),
        {}
      ),
    [teams]
  );

  const handleTeamMetaChange = (teamId: string, field: keyof TeamProfile, value: string) => {
    setTeams((prev) =>
      prev.map((team) => (team.id === teamId ? { ...team, [field]: value } : team))
    );
  };

  const handleSimulationSetting = (field: "overs" | "speed", value: number) => {
    setSimulationConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceToggle = (field: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const homeContent = (
    <div className="content-grid">
      <SimulationCanvas
        teams={teams}
        maxOvers={simulationConfig.overs}
        speed={simulationConfig.speed}
        onSnapshot={setLiveSnapshot}
      />
      <div className="card">
        <h3>Live Match Centre</h3>
        {liveSnapshot ? (
          <>
            <div className="stat-grid">
              <div className="stat-pill">
                <span>Score</span>
                <strong>
                  {liveSnapshot.runs}/{liveSnapshot.wickets}
                </strong>
              </div>
              <div className="stat-pill">
                <span>Overs</span>
                <strong>{liveSnapshot.overs}</strong>
              </div>
              <div className="stat-pill">
                <span>Run Rate</span>
                <strong>{liveSnapshot.runRate.toFixed(2)}</strong>
              </div>
              <div className="stat-pill">
                <span>Batting</span>
                <strong>{liveSnapshot.battingTeam}</strong>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{liveSnapshot.striker?.name ?? "Striker"}</span>
                <span>
                  {liveSnapshot.striker
                    ? `${liveSnapshot.striker.runs} (${liveSnapshot.striker.balls})`
                    : "-"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{liveSnapshot.nonStriker?.name ?? "Non-Striker"}</span>
                <span>
                  {liveSnapshot.nonStriker
                    ? `${liveSnapshot.nonStriker.runs} (${liveSnapshot.nonStriker.balls})`
                    : "-"}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Commentary Stream
              </span>
              <ul style={{ listStyle: "none", marginTop: 8, display: "grid", gap: 6 }}>
                {liveSnapshot.commentary.map((line, index) => (
                  <li key={`${line}-${index}`} style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Launch the simulation to stream live match intelligence, pitch maps, and ball-by-ball
            commentary.
          </p>
        )}
      </div>
      <div className="card">
        <h3>Matchday Pipeline</h3>
        <ul style={{ listStyle: "none", display: "grid", gap: 12 }}>
          {fixtures.map((fixture) => (
            <li
              key={fixture.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: 8,
                borderRadius: 12,
                background: "rgba(15, 23, 42, 0.55)"
              }}
            >
              <span style={{ fontWeight: 600 }}>{fixture.match}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{fixture.date}</span>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>{fixture.venue}</span>
                <span>{fixture.surface}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span className="badge">{fixture.stage}</span>
                <span style={{ color: "var(--accent)" }}>{fixture.broadcast}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const fixturesContent = (
    <div className="content-grid">
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3>Fixture Matrix</h3>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Match</th>
              <th>Venue</th>
              <th>Surface</th>
              <th>Broadcast</th>
              <th>Stage</th>
            </tr>
          </thead>
          <tbody>
            {fixtures.map((fixture) => (
              <tr key={fixture.id}>
                <td>{fixture.date}</td>
                <td>{fixture.match}</td>
                <td>{fixture.venue}</td>
                <td>{fixture.surface}</td>
                <td>{fixture.broadcast}</td>
                <td>{fixture.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const standingsContent = (
    <div className="content-grid">
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3>League Standings</h3>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Team</th>
              <th>Played</th>
              <th>Won</th>
              <th>Lost</th>
              <th>NRR</th>
              <th>Points</th>
              <th style={{ textAlign: "center" }}>Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr key={row.teamIdx}>
                <td>{row.team}</td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.lost}</td>
                <td>{row.nrr.toFixed(2)}</td>
                <td>{row.points}</td>
                <td style={{ textAlign: "center" }}>
                  {row.form.map((token, index) => (
                    <span
                      key={`${row.team}-${token}-${index}`}
                      style={{
                        color: token === "W" ? "var(--success)" : "var(--danger)",
                        margin: "0 4px",
                        fontWeight: 600
                      }}
                    >
                      {token}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const recordsContent = (
    <div className="content-grid">
      {recordBook.map((record) => (
        <div key={record.label} className="card">
          <h3>{record.label}</h3>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>{record.record}</div>
          {record.player && (
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>By {record.player}</div>
          )}
          {record.opponent && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              {record.opponent} · {record.venue}
            </div>
          )}
          <span className="badge" style={{ marginTop: 12 }}>
            {record.season}
          </span>
        </div>
      ))}
    </div>
  );

  const statsContent = (
    <div className="content-grid">
      <div className="card">
        <h3>Run Machine Index</h3>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th>Runs</th>
              <th>SR</th>
              <th>Avg</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            {battingLeaders.map((leader) => (
              <tr key={leader.player}>
                <td>{leader.player}</td>
                <td>{teams[leader.teamIdx]?.shortName ?? "EXT"}</td>
                <td>{leader.runs}</td>
                <td>{leader.strikeRate.toFixed(1)}</td>
                <td>{leader.average.toFixed(1)}</td>
                <td>{leader.impact.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>Bowling Efficiency Grid</h3>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Team</th>
              <th>Wkts</th>
              <th>Eco</th>
              <th>Strike</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            {bowlingLeaders.map((leader) => (
              <tr key={leader.player}>
                <td>{leader.player}</td>
                <td>{teams[leader.teamIdx]?.shortName ?? "EXT"}</td>
                <td>{leader.wickets}</td>
                <td>{leader.economy.toFixed(1)}</td>
                <td>{leader.strikeRate.toFixed(1)}</td>
                <td>{leader.impact.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3>All-Rounder Impact Blend</h3>
        <div className="stat-grid">
          {impactIndex.map((athlete) => (
            <div key={athlete.player} className="stat-pill">
              <span>{athlete.player}</span>
              <strong>{teams[athlete.teamIdx]?.shortName ?? "EXT"}</strong>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span>Bat {athlete.batting.toFixed(1)}</span>
                <span>Bowl {athlete.bowling.toFixed(1)}</span>
                <span>Fld {athlete.fielding.toFixed(1)}</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Clutch Index</div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${athlete.clutch}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const lineupsContent = (
    <div className="content-grid">
      {teams.map((team, index) => (
        <div key={team.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>{team.name}</h3>
            <span className="badge">XI READY</span>
          </div>
          <ul style={{ listStyle: "none", display: "grid", gap: 10 }}>
            {team.lineup.map((player, idx) => (
              <li
                key={`${player.name}-${idx}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(15, 23, 42, 0.55)"
                }}
              >
                <span>
                  <strong style={{ marginRight: 8 }}>{idx + 1}.</strong>
                  {player.name} <span style={{ color: "var(--text-muted)" }}>({player.role})</span>
                </span>
                <span style={{ color: "var(--accent)" }}>
                  Bat {player.batting} · Bowl {player.bowling} · Sta {player.stamina}
                </span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Formation</span>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{team.formation}</div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 6,
                background: team.primaryColor,
                border: "1px solid rgba(255,255,255,0.12)"
              }}
            />
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 6,
                background: team.secondaryColor,
                border: "1px solid rgba(255,255,255,0.12)"
              }}
            />
          </div>
        </div>
      ))}
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3>Lineup Intelligence</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {lineupNotes.map((note, idx) => (
            <div
              key={`${note.teamName}-${idx}`}
              style={{
                padding: 12,
                borderRadius: 12,
                background: "rgba(15, 23, 42, 0.55)",
                border: "1px solid rgba(56, 189, 248, 0.12)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{note.teamName}</strong>
                <span className="badge">STRATEGY</span>
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {note.segments.map((segment) => (
                  <div key={`${segment.title}-${segment.detail}`} style={{ fontSize: 13 }}>
                    <span style={{ color: "var(--accent)" }}>{segment.title}: </span>
                    <span style={{ color: "var(--text-muted)" }}>{segment.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const squadContent = (
    <div className="content-grid">
      <div className="card">
        <h3>Squad Focus</h3>
        <select
          value={selectedSquad}
          onChange={(event) => setSelectedSquad(event.target.value)}
          style={{
            marginTop: 12,
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: 10,
            padding: "10px 12px",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            color: "var(--text-primary)"
          }}
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <div style={{ marginTop: 18 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Bench Monitor
          </span>
          <ul style={{ listStyle: "none", display: "grid", gap: 10, marginTop: 10 }}>
            {benches[selectedSquad]?.map((player) => (
              <li
                key={player.name}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(15, 23, 42, 0.55)",
                  border: "1px solid rgba(56, 189, 248, 0.12)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>
                    <strong>{player.name}</strong> ·{" "}
                    <span style={{ color: "var(--text-muted)" }}>{player.role}</span>
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  {player.development}
                </div>
              </li>
            )) ?? (
              <li style={{ fontSize: 13, color: "var(--text-muted)" }}>No bench configured.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="card">
        <h3>Academy Pipeline</h3>
        <div style={{ display: "grid", gap: 14 }}>
          {academyPipeline.map((module) => (
            <div key={module.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <strong>{module.label}</strong>
                <span style={{ color: "var(--accent)" }}>{module.success}% readiness</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                {module.focus}
              </div>
              <div className="progress" style={{ marginTop: 8, height: 6 }}>
                <div className="progress-bar" style={{ width: `${module.success}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3>Team Snapshot</h3>
        <div className="stat-grid">
          {teams.map((team) => {
            const batRating = team.lineup.slice(0, 6).reduce((acc, player) => acc + player.batting, 0);
            const bowlRating = team.lineup.slice(-5).reduce((acc, player) => acc + player.bowling, 0);
            const stamina = team.lineup.reduce((acc, player) => acc + player.stamina, 0);
            return (
              <div key={team.id} className="stat-pill">
                <span>{team.name}</span>
                <strong>Captain · {team.captain}</strong>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  Bat {Math.round(batRating / 6)} · Bowl {Math.round(bowlRating / 5)} · Energy{" "}
                  {Math.round(stamina / team.lineup.length)}
                </div>
                <div className="progress" style={{ marginTop: 6, height: 6 }}>
                  <div
                    className="progress-bar"
                    style={{ width: `${clamp((batRating + bowlRating) / 12, 10, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const editorContent = (
    <div className="content-grid">
      {teams.map((team) => (
        <div key={team.id} className="card">
          <h3>{team.name} Editor</h3>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <label style={{ fontSize: 12 }}>
              <span style={{ display: "block", color: "var(--text-muted)", marginBottom: 4 }}>Team Name</span>
              <input
                value={team.name}
                onChange={(event) => handleTeamMetaChange(team.id, "name", event.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(56, 189, 248, 0.18)",
                  color: "var(--text-primary)"
                }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              <span style={{ display: "block", color: "var(--text-muted)", marginBottom: 4 }}>Short Name</span>
              <input
                value={team.shortName}
                onChange={(event) => handleTeamMetaChange(team.id, "shortName", event.target.value.toUpperCase())}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(56, 189, 248, 0.18)",
                  color: "var(--text-primary)",
                  letterSpacing: "0.16em"
                }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              <span style={{ display: "block", color: "var(--text-muted)", marginBottom: 4 }}>Coach</span>
              <input
                value={team.coach}
                onChange={(event) => handleTeamMetaChange(team.id, "coach", event.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(56, 189, 248, 0.18)",
                  color: "var(--text-primary)"
                }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              <span style={{ display: "block", color: "var(--text-muted)", marginBottom: 4 }}>Captain</span>
              <input
                value={team.captain}
                onChange={(event) => handleTeamMetaChange(team.id, "captain", event.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(56, 189, 248, 0.18)",
                  color: "var(--text-primary)"
                }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              <span style={{ display: "block", color: "var(--text-muted)", marginBottom: 4 }}>Primary Color</span>
              <input
                type="color"
                value={team.primaryColor}
                onChange={(event) => handleTeamMetaChange(team.id, "primaryColor", event.target.value)}
                style={{ width: "100%", height: 44, borderRadius: 10, border: "none", cursor: "pointer" }}
              />
            </label>
            <label style={{ fontSize: 12 }}>
              <span style={{ display: "block", color: "var(--text-muted)", marginBottom: 4 }}>Secondary Color</span>
              <input
                type="color"
                value={team.secondaryColor}
                onChange={(event) => handleTeamMetaChange(team.id, "secondaryColor", event.target.value)}
                style={{ width: "100%", height: 44, borderRadius: 10, border: "none", cursor: "pointer" }}
              />
            </label>
          </div>
        </div>
      ))}
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3>Simulation Controls</h3>
        <div style={{ display: "grid", gap: 16, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
              <span>Match Overs</span>
              <span>{simulationConfig.overs} overs</span>
            </label>
            <input
              type="range"
              min={5}
              max={50}
              value={simulationConfig.overs}
              onChange={(event) => handleSimulationSetting("overs", Number(event.target.value))}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
              <span>Simulation Tempo</span>
              <span>{simulationConfig.speed.toFixed(2)}x</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.1}
              value={simulationConfig.speed}
              onChange={(event) => handleSimulationSetting("speed", Number(event.target.value))}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(15, 23, 42, 0.55)"
            }}
          >
            <span>Auto Commentary Feed</span>
            <span style={{ color: preferences.commentaryFeed ? "var(--success)" : "var(--danger)" }}>
              {preferences.commentaryFeed ? "Enabled" : "Muted"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const settingsContent = (
    <div className="content-grid">
      <div className="card">
        <h3>Presentation Settings</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {(Object.keys(preferences) as (keyof typeof preferences)[]).map((key) => (
            <label
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(15, 23, 42, 0.55)"
              }}
            >
              <span style={{ textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</span>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={() => handlePreferenceToggle(key)}
                style={{ width: 18, height: 18 }}
              />
            </label>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Visual Mood</h3>
        <label style={{ fontSize: 12, display: "flex", justifyContent: "space-between" }}>
          <span>Aurora Density</span>
          <span>{themeIntensity}%</span>
        </label>
        <input
          type="range"
          min={10}
          max={100}
          value={themeIntensity}
          onChange={(event) => setThemeIntensity(Number(event.target.value))}
          style={{ width: "100%", marginTop: 8 }}
        />
        <div style={{ marginTop: 18, fontSize: 13 }}>
          <div style={{ color: "var(--text-muted)", marginBottom: 6 }}>Preset Modes</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[48, 72, 96].map((preset) => (
              <button
                key={preset}
                onClick={() => setThemeIntensity(preset)}
                className="btn secondary"
                style={{
                  flex: 1,
                  background:
                    themeIntensity === preset
                      ? "rgba(56, 189, 248, 0.3)"
                      : "rgba(148,163,184,0.2)"
                }}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3>Telemetry Stream</h3>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.55)",
              fontSize: 13
            }}
          >
            <span>Live Ball Tracking</span>
            <span style={{ color: "var(--accent)" }}>Enabled</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.55)",
              fontSize: 13
            }}
          >
            <span>Match State Autosave</span>
            <span style={{ color: preferences.autoSave ? "var(--success)" : "var(--danger)" }}>
              {preferences.autoSave ? "On" : "Off"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.55)",
              fontSize: 13
            }}
          >
            <span>Dynamic Weather Engine</span>
            <span style={{ color: preferences.dynamicWeather ? "var(--accent)" : "var(--danger)" }}>
              {preferences.dynamicWeather ? "Ultra" : "Static"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const tabPanels: Record<TabId, JSX.Element> = {
    home: homeContent,
    fixtures: fixturesContent,
    standings: standingsContent,
    records: recordsContent,
    stats: statsContent,
    lineups: lineupsContent,
    squad: squadContent,
    editor: editorContent,
    settings: settingsContent
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">26</div>
          <div className="brand-text">
            <span className="brand-title">CRICKET 26 2D</span>
            <span className="brand-subtitle">Simulation Engine</span>
          </div>
        </div>
        <div className="nav-section">
          <span className="nav-label">Navigation</span>
          <div className="nav-grid">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-button ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <TabLabel label={tab.label} accent={tab.accent} />
              </button>
            ))}
          </div>
        </div>
      </aside>
      <main className="main-panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">{tabs.find((tab) => tab.id === activeTab)?.label}</div>
            <div className="panel-subtitle">
              {activeTab === "home"
                ? "Drive the Aurora Engine simulation: build strategies, stream analytics, and take tactical control."
                : activeTab === "fixtures"
                ? "Review the interstellar schedule, surfaces, and broadcast grids for Cricket 26."
                : activeTab === "standings"
                ? "Track form, net run rate momentum, and playoff projections."
                : activeTab === "records"
                ? "Celebrate historic peaks across the Cricket 26 multiverse."
                : activeTab === "stats"
                ? "Crunch elite player metrics, impact ratings, and role clarity."
                : activeTab === "lineups"
                ? "Lock in elevens, formations, and situational tactics."
                : activeTab === "squad"
                ? "Monitor bench readiness, academy surge, and roster wellness."
                : activeTab === "editor"
                ? "Shape brands, colors, and matchup parameters."
                : "Fine-tune presentation layers and telemetry feeds."}
            </div>
          </div>
          <div className="badge">Agentic Build</div>
        </div>
        {tabPanels[activeTab]}
      </main>
    </div>
  );
}
