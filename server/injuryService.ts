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
 * Fetch all current NBA injuries from ESPN's injury report page
 * This endpoint provides comprehensive injury data for all teams
 */
async function fetchAllESPNInjuries(): Promise<InjuryReport[]> {
  try {
    // ESPN's comprehensive injury report endpoint
    const response = await fetch(
      "https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=30",
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      }
    );
    
    if (!response.ok) {
      console.error("ESPN API error:", response.statusText);
      return [];
    }
    
    const data = await response.json();
    const injuries: InjuryReport[] = [];
    
    // Fetch injury data for each team
    if (data.sports?.[0]?.leagues?.[0]?.teams) {
      const teams = data.sports[0].leagues[0].teams;
      
      for (const teamData of teams) {
        const team = teamData.team;
        const teamAbbr = team.abbreviation || "";
        
        try {
          // Fetch team roster with injury data
          const rosterResponse = await fetch(
            `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${team.id}/roster`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              }
            }
          );
          
          if (rosterResponse.ok) {
            const rosterData = await rosterResponse.json();
            
            // Check athletes for injuries
            if (rosterData.athletes) {
              for (const athlete of rosterData.athletes) {
                if (athlete.injuries && athlete.injuries.length > 0) {
                  const injury = athlete.injuries[0];
                  injuries.push({
                    playerId: parseInt(athlete.id) || 0,
                    playerName: athlete.displayName || athlete.fullName || "",
                    team: teamAbbr,
                    position: athlete.position?.abbreviation || "",
                    status: mapInjuryStatus(injury.status),
                    injuryType: injury.type || "Unknown",
                    description: injury.details || injury.longComment || injury.shortComment || "",
                    lastUpdated: new Date(injury.date || Date.now()),
                    expectedReturn: injury.returnDate
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching roster for team ${teamAbbr}:`, error);
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
 * Fetch injuries from today's games (fallback method)
 */
async function fetchTodayGameInjuries(): Promise<InjuryReport[]> {
  try {
    const response = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const injuries: InjuryReport[] = [];
    
    if (data.events) {
      for (const event of data.events) {
        for (const competition of event.competitions || []) {
          for (const competitor of competition.competitors || []) {
            const team = competitor.team?.abbreviation || "";
            
            if (competitor.roster) {
              for (const athlete of competitor.roster) {
                if (athlete.injuries && athlete.injuries.length > 0) {
                  const injury = athlete.injuries[0];
                  injuries.push({
                    playerId: parseInt(athlete.athlete?.id) || 0,
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
    console.error("Error fetching today's game injuries:", error);
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
 * Fetches fresh data every time
 */
export async function getPlayerInjuryStatus(playerName: string): Promise<InjuryReport | null> {
  // Try comprehensive injury list first
  let injuries = await fetchAllESPNInjuries();
  
  // Fallback to today's games if comprehensive list is empty
  if (injuries.length === 0) {
    injuries = await fetchTodayGameInjuries();
  }
  
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
 * Fetches fresh data every time this is called
 */
export async function getAllInjuries(): Promise<InjuryReport[]> {
  // Try comprehensive injury list first
  let injuries = await fetchAllESPNInjuries();
  
  // Fallback to today's games if comprehensive list is empty
  if (injuries.length === 0) {
    injuries = await fetchTodayGameInjuries();
  }
  
  // If still no injuries, return empty array (not simulated data)
  return injuries;
}

/**
 * Get injuries for a specific team
 */
export async function getTeamInjuries(teamAbbr: string): Promise<InjuryReport[]> {
  const allInjuries = await getAllInjuries();
  return allInjuries.filter(inj => 
    inj.team.toLowerCase() === teamAbbr.toLowerCase()
  );
}
