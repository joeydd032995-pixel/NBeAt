import { syncCompleteRosters } from './server/espnCompleteRostersService.ts';

async function test() {
  try {
    const result = await syncCompleteRosters();
    console.log("Result:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
