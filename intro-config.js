// Adjust the leap and its pauses. No build step is required.
window.FutureIntroConfig = {
  targetDate: '2048-01-01', // YYYY-MM-DD; the opening date in the future world.
  durationMs: 5500,       // Accelerating date flips after today's date is shown.
  departureHoldMs: 1000,  // Pause on today's date before the clock starts.
  arrivalHoldMs: 900      // Pause at 2048 before automatically entering the map.
};
