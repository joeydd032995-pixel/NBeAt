/**
 * Import real 2025-26 NBA stats from JSON into database
 */

import { db } from "../server/_core/db";
import { players } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface PlayerStats {
  fullName: string;
  position: string;
  team: string;
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
