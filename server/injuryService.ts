import { getDb } from "./db";
import { players } from "../drizzle/schema";

export interface InjuryReport {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  status: "OUT" | "QUESTIONABLE" | "DOUBTFUL" | "DAY_TO_DAY" | "HEALTHY";
  injuryType: string;
  description: string;
  lastUpdated: Date;
  expectedReturn?: string;
}

/**
 * Fetch injury reports from ESPN API
 * ESPN provides free injury data for NBA
 */
async function fetchESPNInjuries(): Promise<InjuryReport[]> {
  try {
    // ESPN injury endpoint
    const response = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
    );
    
    if (!response.ok) {
      console.error("ESPN API error:", response.statusText);
      return [];
    }
    
    const data = await response.json();
    const injuries: InjuryReport[] = [];
    
    // Parse ESPN data for injury information
    // ESPN includes injury data in team rosters
    if (data.events) {
      for (const event of data.events) {
        for (const competition of event.competitions || []) {
          for (const competitor of competition.competitors || []) {
            const team = competitor.team?.abbreviation || "";
            
            // Check roster for injuries
            if (competitor.roster) {
              for (const athlete of competitor.roster) {
                if (athlete.injuries && athlete.injuries.length > 0) {
                  const injury = athlete.injuries[0];
                  injuries.push({
                    playerId: 0, // Will be matched later
                    playerName: athlete.athlete?.displayName || "",
                    team: team,
                    position: athlete.position?.abbreviation || "",
                    status: mapInjuryStatus(injury.status),
                    injuryType: injury.type || "Unknown",
                    description: injury.details || injury.longComment || "",
                    lastUpdated: new Date(),
                    expectedReturn: injury.returnDate
                  });
                }
              }
            }
          }
        }
      }
    }
    
    return injuries;
  } catch (error) {
    console.error("Error fetching ESPN injuries:", error);
    return [];
  }
}

/**
 * Map ESPN injury status to our enum
 */
function mapInjuryStatus(status: string): InjuryReport["status"] {
  const normalized = status.toUpperCase();
  if (normalized.includes("OUT")) return "OUT";
  if (normalized.includes("QUESTION")) return "QUESTIONABLE";
  if (normalized.includes("DOUBT")) return "DOUBTFUL";
  if (normalized.includes("DAY")) return "DAY_TO_DAY";
  return "HEALTHY";
}

/**
 * Get injury status for a specific player
 */
export async function getPlayerInjuryStatus(playerName: string): Promise<InjuryReport | null> {
  const injuries = await fetchESPNInjuries();
  
  // Find matching player
  const injury = injuries.find(inj => 
    inj.playerName.toLowerCase().includes(playerName.toLowerCase()) ||
    playerName.toLowerCase().includes(inj.playerName.toLowerCase())
  );
  
  if (!injury) {
    return {
      playerId: 0,
      playerName: playerName,
      team: "",
      position: "",
      status: "HEALTHY",
      injuryType: "None",
      description: "No injury reported",
      lastUpdated: new Date()
    };
  }
  
  return injury;
}

/**
 * Get all current NBA injuries
 */
export async function getAllInjuries(): Promise<InjuryReport[]> {
  return await fetchESPNInjuries();
}

/**
 * Get injuries for a specific team
 */
export async function getTeamInjuries(teamAbbr: string): Promise<InjuryReport[]> {
  const allInjuries = await fetchESPNInjuries();
  return allInjuries.filter(inj => 
    inj.team.toLowerCase() === teamAbbr.toLowerCase()
  );
}

/**
 * Simulated injury data for development/testing
 * In production, this would be replaced with real API data
 */
export function getSimulatedInjuries(): InjuryReport[] {
  return [
    {
      playerId: 0,
      playerName: "LeBron James",
      team: "LAL",
      position: "F",
      status: "QUESTIONABLE",
      injuryType: "Ankle",
      description: "Left ankle soreness, game-time decision",
      lastUpdated: new Date(),
      expectedReturn: "Game-time decision"
    },
    {
      playerId: 0,
      playerName: "Stephen Curry",
      team: "GSW",
      position: "G",
      status: "DAY_TO_DAY",
      injuryType: "Shoulder",
      description: "Right shoulder strain, day-to-day",
      lastUpdated: new Date()
    },
    {
      playerId: 0,
      playerName: "Kawhi Leonard",
      team: "LAC",
      position: "F",
      status: "OUT",
      injuryType: "Knee",
      description: "Right knee management, out indefinitely",
      lastUpdated: new Date(),
      expectedReturn: "TBD"
    }
  ];
}
