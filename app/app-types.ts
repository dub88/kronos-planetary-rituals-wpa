/**
 * Type definitions for the planetary rituals app
 */

// Basic planet types
export type PlanetName = 'saturn' | 'jupiter' | 'mars' | 'sun' | 'venus' | 'mercury' | 'moon';
export type DayName = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

// Display names for UI
export type PlanetDisplayName = 'Saturn' | 'Jupiter' | 'Mars' | 'Sun' | 'Venus' | 'Mercury' | 'Moon';
export type DayDisplayName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

// Planetary hour type
export type PlanetaryHour = {
  planet: PlanetName;
  startTime: Date;
  endTime: Date;
  isDayHour: boolean;
  hourNumber: number;
};

// Planet information
export type PlanetInfo = {
  name: PlanetDisplayName;
  ruler: PlanetName;
};
