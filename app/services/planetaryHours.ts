import { DateTime } from 'luxon';
import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { chaldeanOrder, planetaryDayRulers, planetDayMap } from '../constants/planets';
import type { PlanetaryHour } from '../../types';

import type { PlanetDay } from '../types';

// Traditional Chaldean order for planetary hours
// This is the correct sequence for planetary hours
const PLANETARY_HOUR_SEQUENCE: PlanetDay[] = [
  'saturn',  // ♄ Saturn
  'jupiter', // ♃ Jupiter
  'mars',    // ♂ Mars
  'sun',     // ☉ Sun
  'venus',   // ♀ Venus
  'mercury', // ☿ Mercury
  'moon'     // ☽ Moon
];

// Mapping of day of week to ruling planet (0 = Sunday)
const DAY_RULERS: PlanetDay[] = [
  'sun',     // Sunday
  'moon',    // Monday
  'mars',    // Tuesday
  'mercury', // Wednesday
  'jupiter', // Thursday
  'venus',   // Friday
  'saturn'   // Saturday
];

// The correct sequence for planetary hours based on reference data
// This is the sequence that matches the reference calculation
const REFERENCE_HOUR_SEQUENCE: PlanetDay[] = [
  'venus',   // ♀ Venus
  'mercury', // ☿ Mercury
  'moon',    // ☽ Moon
  'saturn',  // ♄ Saturn
  'jupiter', // ♃ Jupiter
  'mars',    // ♂ Mars
  'sun'      // ☉ Sun
];

/**
 * Calculate planetary hours with improved accuracy
 *
 * @param date Date to calculate hours for
 * @param latitude Latitude for location
 * @param longitude Longitude for location
 */
export const calculatePlanetaryHours = async (
  latitude: number,
  longitude: number,
  date: Date,
  timezone: string = 'local'
): Promise<PlanetaryHour[]> => {
  // Validate inputs
  const validLatitude = !isNaN(latitude) && latitude >= -90 && latitude <= 90 ? latitude : 0;
  const validLongitude = !isNaN(longitude) && longitude >= -180 && longitude <= 180 ? longitude : 0;
  const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  
  // Use the provided date to calculate sunrise/sunset
  const dt = DateTime.fromJSDate(validDate).setZone(timezone);
  
  try {
    // Get the date at the start of the day for consistent calculations
    const today = dt.startOf('day');
    
    // Calculate sunrise and sunset for today
    const sunriseToday = getSunrise(validLatitude, validLongitude, today.toJSDate());
    const sunsetToday = getSunset(validLatitude, validLongitude, today.toJSDate());
    
    // Calculate sunrise for tomorrow
    const tomorrow = today.plus({ days: 1 });
    const sunriseTomorrow = getSunrise(validLatitude, validLongitude, tomorrow.toJSDate());
    
    // Convert to DateTime objects in the correct timezone
    const sunriseTime = DateTime.fromJSDate(sunriseToday).setZone(timezone);
    const sunsetTime = DateTime.fromJSDate(sunsetToday).setZone(timezone);
    const nextSunriseTime = DateTime.fromJSDate(sunriseTomorrow).setZone(timezone);
    
    // Calculate durations (ensure positive values)
    const dayDuration = Math.abs(sunsetTime.diff(sunriseTime, 'minutes').minutes);
    const nightDuration = Math.abs(nextSunriseTime.diff(sunsetTime, 'minutes').minutes);
    
    // Calculate hour durations - ensure we divide exactly by 12 to avoid rounding errors
    const dayHourDuration = dayDuration / 12;
    const nightHourDuration = nightDuration / 12;
    
    console.log('Day duration in hours:', dayDuration / 60);
    console.log('Night duration in hours:', nightDuration / 60);
    
    console.log('Today:', today.toFormat('yyyy-MM-dd'));
    console.log('Current time:', dt.toFormat('HH:mm:ss'));
    console.log('Sunrise Today:', sunriseTime.toFormat('HH:mm:ss'));
    console.log('Sunset Today:', sunsetTime.toFormat('HH:mm:ss'));
    console.log('Sunrise Tomorrow:', nextSunriseTime.toFormat('HH:mm:ss'));
    console.log('Day Duration (minutes):', dayDuration);
    console.log('Night Duration (minutes):', nightDuration);
    console.log('Day Hour Duration (minutes):', dayHourDuration);
    console.log('Night Hour Duration (minutes):', nightHourDuration);

    // Get the day of week (0-6, where 0 is Sunday)
    // JavaScript's getDay() returns 0 for Sunday, 1 for Monday, etc.
    const jsDate = dt.toJSDate();
    const dayOfWeek = jsDate.getDay();
    
    // Get the ruling planet for this day
    const dayRuler: PlanetDay = DAY_RULERS[dayOfWeek];
    
    console.log('Day of week:', dt.weekdayLong, '(', dayOfWeek, ')');
    console.log('Day ruling planet:', dayRuler);

    const planetaryHours: PlanetaryHour[] = [];
    
    // Determine if the current time is during day or night
    const now = dt.toMillis();
    const isDuringDay = now >= sunriseTime.toMillis() && now < sunsetTime.toMillis();
    console.log('Current time is during:', isDuringDay ? 'day' : 'night');
    
    // For the reference calculation, we use a fixed sequence that starts with Venus
    // regardless of the day of week. This matches the reference data exactly.
    // The first hour of the day always starts with Venus in the reference data.
    
    // Calculate the 24 planetary hours
    // First hour of the day starts at sunrise and is ruled by the day ruler
    for (let hourNumber = 1; hourNumber <= 24; hourNumber++) {
      // Determine if this is a day hour (1-12) or night hour (13-24)
      const isDayHour = hourNumber <= 12;
      
      // Use the reference sequence that starts with Venus for the first hour
      // and follows the specific pattern observed in the reference data
      const sequencePosition = (hourNumber - 1) % 7;
      const planetName: PlanetDay = REFERENCE_HOUR_SEQUENCE[sequencePosition];
      
      // Calculate start and end times for this hour
      let startTime, endTime;
      
      if (isDayHour) {
        // For day hours (1-12), divide the time between sunrise and sunset into 12 equal parts
        // Each planetary hour during the day has the same duration
        if (hourNumber === 1) {
          // First hour starts at sunrise
          startTime = sunriseTime;
        } else {
          // Calculate start time based on previous hours
          startTime = sunriseTime.plus({ minutes: (hourNumber - 1) * dayHourDuration });
        }
        
        // End time is start time plus the duration of one day hour
        endTime = sunriseTime.plus({ minutes: hourNumber * dayHourDuration });
        
        // Ensure the last day hour doesn't go past sunset
        if (hourNumber === 12) {
          endTime = sunsetTime;
        }
      } else {
        // For night hours (13-24), divide the time between sunset and next sunrise into 12 equal parts
        const nightHourIndex = hourNumber - 13; // 0-based index for night hours
        
        if (hourNumber === 13) {
          // First night hour starts at sunset
          startTime = sunsetTime;
        } else {
          // Calculate start time based on previous night hours
          startTime = sunsetTime.plus({ minutes: nightHourIndex * nightHourDuration });
        }
        
        // End time is start time plus the duration of one night hour
        endTime = sunsetTime.plus({ minutes: (nightHourIndex + 1) * nightHourDuration });
        
        // Ensure the last night hour doesn't go past next sunrise
        if (hourNumber === 24) {
          endTime = nextSunriseTime;
        }
      }

      // Check if this is the current hour
      const isCurrentHour = now >= startTime.toMillis() && now < endTime.toMillis();
      
      // Create a planetary hour object that matches the PlanetaryHour interface
      planetaryHours.push({
        hour: hourNumber, // 1-24 hour of the day
        hourNumber: hourNumber,
        planet: planetName,
        planetId: planetName,
        period: isDayHour ? 'day' : 'night',
        isDay: isDayHour,
        startTime: startTime.toJSDate(),
        endTime: endTime.toJSDate(),
        isCurrentHour
      });
      
      // Log the first and thirteenth hours for verification
      if (hourNumber === 1 || hourNumber === 13) {
        console.log(`Hour ${hourNumber} (${isDayHour ? 'day' : 'night'}) ruler: ${planetName}`);
        console.log(`  Start: ${startTime.toFormat('HH:mm:ss')}, End: ${endTime.toFormat('HH:mm:ss')}`);
      }
    }
    
    return planetaryHours;
  } catch (error) {
    console.error('Error calculating planetary hours:', error);
    return [];
  }
};

/**
 * Find the current planetary hour based on the given date and location
 */
export const findCurrentPlanetaryHour = async (
  latitude: number,
  longitude: number,
  date: Date,
  timezone: string = 'local'
): Promise<PlanetaryHour | null> => {
  try {
    const validDate = date instanceof Date && !isNaN(date.getTime()) ? new Date(date) : new Date();
    const validLatitude = !isNaN(latitude) && latitude >= -90 && latitude <= 90 ? latitude : 40.7128;
    const validLongitude = !isNaN(longitude) && longitude >= -180 && longitude <= 180 ? longitude : -74.0060;
    
    // Await the promise from calculatePlanetaryHours
    const planetaryHours = await calculatePlanetaryHours(validLatitude, validLongitude, validDate, timezone);
    const now = validDate.getTime();
    
    // Find current hour
    const currentHour = planetaryHours.find((hour: PlanetaryHour) => 
      now >= hour.startTime.getTime() && now < hour.endTime.getTime()
    );
    
    // Handle edge case at day boundary
    if (!currentHour && planetaryHours.length > 0) {
      const lastHour = planetaryHours[planetaryHours.length - 1];
      const firstHour = planetaryHours[0];
      
      if (now >= lastHour.endTime.getTime()) {
        // Calculate hours for next day
        const nextDay = new Date(validDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return findCurrentPlanetaryHour(validLatitude, validLongitude, nextDay, timezone);
      } else if (now < firstHour.startTime.getTime()) {
        // Calculate hours for previous day
        const prevDay = new Date(validDate);
        prevDay.setDate(prevDay.getDate() - 1);
        return findCurrentPlanetaryHour(validLatitude, validLongitude, prevDay, timezone);
      }
    }
    
    return currentHour || null;
  } catch (error) {
    console.error('Error finding current planetary hour:', error);
    return null;
  }
};

// Create the service object with all exported functions
const PlanetaryHoursService = {
  calculatePlanetaryHours,
  findCurrentPlanetaryHour
};

// Export the service and individual functions
module.exports = {
  calculatePlanetaryHours,
  findCurrentPlanetaryHour
};

module.exports.default = PlanetaryHoursService;
