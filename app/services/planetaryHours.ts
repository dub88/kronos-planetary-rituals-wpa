import { DateTime } from 'luxon';
import { chaldeanOrder, planetaryDayRulers, planetarySymbols } from '../constants/planets';
import type { PlanetDay, PlanetaryHour } from '../types';
// Using require for SunCalc to avoid dynamic import issues
const SunCalc = require('suncalc');

/**
 * Calculates the planetary hours for a given date and location.
 * @param latitude - The latitude of the location
 * @param longitude - The longitude of the location
 * @param date - The date for which to calculate planetary hours
 * @param timezone - The timezone of the location (e.g., 'America/New_York')
 * @param wakingHourStart - Optional: The start of waking hours (0-23)
 * @param wakingHourEnd - Optional: The end of waking hours (0-23)
 * @returns An array of planetary hour objects
 */
export const calculatePlanetaryHours = async (
  latitude: number,
  longitude: number,
  date: Date = new Date(),
  timezone: string = 'UTC',
  wakingHourStart: number = 6,  // Default waking hours start at 6 AM
  wakingHourEnd: number = 22    // Default waking hours end at 10 PM
): Promise<PlanetaryHour[]> => {
  console.log(`Calculating planetary hours for ${DateTime.fromJSDate(date).toFormat('yyyy-MM-dd')} at ${latitude}, ${longitude}`);
  
  try {
    // Get the day of the week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = date.getDay();
    const rulingPlanet = planetaryDayRulers[dayOfWeek] as PlanetDay;
    const startIndex = chaldeanOrder.indexOf(rulingPlanet);
    
    // Calculate sunrise and sunset times for the given date and location
    const times = SunCalc.getTimes(date, latitude, longitude);
    const sunrise = DateTime.fromJSDate(times.sunrise).setZone(timezone);
    const sunset = DateTime.fromJSDate(times.sunset).setZone(timezone);
    
    // Calculate sunrise for the next day to determine the end of the night
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextTimes = SunCalc.getTimes(nextDate, latitude, longitude);
    const nextSunrise = DateTime.fromJSDate(nextTimes.sunrise).setZone(timezone);
    
    // Calculate the duration of day and night in minutes
    const dayDuration = sunset.diff(sunrise, 'minutes').minutes;
    const nightDuration = nextSunrise.diff(sunset, 'minutes').minutes;
    
    // Calculate the length of each planetary hour
    const dayHourLength = dayDuration / 12;
    const nightHourLength = nightDuration / 12;
    
    console.log(`Sunrise: ${sunrise.toFormat('HH:mm')}`);
    console.log(`Sunset: ${sunset.toFormat('HH:mm')}`);
    console.log(`Next Sunrise: ${nextSunrise.toFormat('HH:mm')}`);
    console.log(`Day Duration: ${dayDuration.toFixed(2)} minutes`);
    console.log(`Night Duration: ${nightDuration.toFixed(2)} minutes`);
    console.log(`Day Hour Length: ${dayHourLength.toFixed(2)} minutes`);
    console.log(`Night Hour Length: ${nightHourLength.toFixed(2)} minutes`);
    console.log(`Day of week: ${DateTime.fromJSDate(date).weekdayLong} (${dayOfWeek})`);
    console.log(`Day ruling planet: ${rulingPlanet}`);
    
    // Get the current time
    const now = DateTime.fromJSDate(date).setZone(timezone);
    
    // Array to store the 24 planetary hours
    const planetaryHours: PlanetaryHour[] = [];
    
    // Loop through all 24 hours
    for (let i = 0; i < 24; i++) {
      let startTime: DateTime, endTime: DateTime;
      const isDayHour = i < 12;
      
      if (isDayHour) {
        // Day hours (sunrise to sunset)
        startTime = sunrise.plus({ minutes: i * dayHourLength });
        endTime = sunrise.plus({ minutes: (i + 1) * dayHourLength });
        
        // Ensure the last day hour ends exactly at sunset
        if (i === 11) {
          endTime = sunset;
        }
      } else {
        // Night hours (sunset to next sunrise)
        const nightIndex = i - 12;
        startTime = sunset.plus({ minutes: nightIndex * nightHourLength });
        endTime = sunset.plus({ minutes: (nightIndex + 1) * nightHourLength });
        
        // Ensure the last night hour ends exactly at next sunrise
        if (i === 23) {
          endTime = nextSunrise;
        }
      }
      
      // Assign the planet using the Chaldean order, cycling through with modulo
      const planetName = chaldeanOrder[(startIndex + i) % 7] as PlanetDay;
      
      // Check if this is the current hour
      const isCurrentHour = now >= startTime && now < endTime;
      
      // Add the hour to the array
      planetaryHours.push({
        hour: i + 1,
        hourNumber: i + 1,
        planet: planetName,
        planetId: planetName,
        period: isDayHour ? 'day' : 'night',
        isDay: isDayHour,
        startTime: startTime.toJSDate(),
        endTime: endTime.toJSDate(),
        isCurrentHour
      });
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
