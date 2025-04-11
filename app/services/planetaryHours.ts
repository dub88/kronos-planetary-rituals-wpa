import { DateTime } from 'luxon';
import { chaldeanOrder, planetaryDayRulers, planetarySymbols } from '../constants/planets';
import type { PlanetDay, PlanetaryHour } from '../types';
// Import SunCalc with proper error handling
let SunCalc: any;
try {
  // Try to import SunCalc
  SunCalc = require('suncalc');
  console.log('SunCalc loaded successfully');
} catch (error) {
  console.error('Error loading SunCalc:', error);
  // Fallback to a simple sunrise/sunset calculation if SunCalc fails to load
  SunCalc = {
    getTimes: (date: Date, lat: number, lng: number) => {
      console.warn('Using fallback sunrise/sunset calculation');
      // Simple fallback calculation (approximate)
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      // Default sunrise around 6 AM
      const sunrise = new Date(year, month, day, 6, 0, 0);
      // Default sunset around 6 PM
      const sunset = new Date(year, month, day, 18, 0, 0);
      return { sunrise, sunset };
    }
  };
}

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
  console.log(`Using timezone: ${timezone}`);
  
  // Validate inputs to prevent errors
  const validLatitude = !isNaN(latitude) && latitude >= -90 && latitude <= 90 ? latitude : 0;
  const validLongitude = !isNaN(longitude) && longitude >= -180 && longitude <= 180 ? longitude : 0;
  const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  
  if (validLatitude !== latitude || validLongitude !== longitude) {
    console.warn('Invalid coordinates provided, using fallback values:', validLatitude, validLongitude);
  }
  
  try {
    // Get the day of the week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = validDate.getDay();
    const rulingPlanet = planetaryDayRulers[dayOfWeek] as PlanetDay;
    const startIndex = chaldeanOrder.indexOf(rulingPlanet);
    
    console.log(`Day of week: ${dayOfWeek} (${DateTime.fromJSDate(validDate).weekdayLong})`);
    console.log(`Ruling planet: ${rulingPlanet}`);
    console.log(`Start index in Chaldean order: ${startIndex}`);
    console.log(`Chaldean order:`, chaldeanOrder);
    
    // Calculate sunrise and sunset times for the given date and location
    console.log(`Calculating sun times for: ${validDate.toISOString()}`);
    const times = SunCalc.getTimes(validDate, validLatitude, validLongitude);
    console.log('Raw sun times:', times.sunrise, times.sunset);
    
    // Convert to DateTime objects in the correct timezone
    const sunrise = DateTime.fromJSDate(times.sunrise).setZone(timezone);
    const sunset = DateTime.fromJSDate(times.sunset).setZone(timezone);
    
    console.log(`Sunrise (${timezone}): ${sunrise.toISO()}`);
    console.log(`Sunset (${timezone}): ${sunset.toISO()}`);
    
    // Calculate sunrise for the next day to determine the end of the night
    const nextDate = new Date(validDate);
    nextDate.setDate(nextDate.getDate() + 1);
    console.log(`Calculating next day sun times for: ${nextDate.toISOString()}`);
    const nextTimes = SunCalc.getTimes(nextDate, validLatitude, validLongitude);
    const nextSunrise = DateTime.fromJSDate(nextTimes.sunrise).setZone(timezone);
    console.log(`Next sunrise (${timezone}): ${nextSunrise.toISO()}`);
    
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
    
    // Get the ACTUAL current time (not the date passed in)
    // This ensures the "now" indicator is always correct regardless of the selected date
    const actualNow = DateTime.now().setZone(timezone);
    console.log(`Actual current time in ${timezone}: ${actualNow.toISO()}`);
    
    // Get the time from the passed date (for calculation purposes)
    const dateTime = DateTime.fromJSDate(validDate).setZone(timezone);
    
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
      
      // Check if this is the current hour - only mark as current if we're viewing today's date
      // This prevents the "now" indicator from showing on past or future dates
      const isToday = dateTime.hasSame(actualNow, 'day');
      const isCurrentHour = isToday && (actualNow >= startTime && actualNow < endTime);
      
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
  date: Date = new Date(),
  timezone: string = 'UTC'
): Promise<PlanetaryHour | null> => {
  console.log(`Finding current planetary hour for ${DateTime.fromJSDate(date).toFormat('yyyy-MM-dd HH:mm:ss')} at ${latitude}, ${longitude}`);
  
  try {
    // Validate inputs to prevent errors
    const validLatitude = !isNaN(latitude) && latitude >= -90 && latitude <= 90 ? latitude : 0;
    const validLongitude = !isNaN(longitude) && longitude >= -180 && longitude <= 180 ? longitude : 0;
    const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    
    // Get the current time in the specified timezone
    const now = DateTime.fromJSDate(validDate).setZone(timezone);
    console.log(`Current time in ${timezone}: ${now.toISO()}`);
    
    // Calculate all planetary hours for the day
    console.log('Calculating planetary hours for current day...');
    const planetaryHours = await calculatePlanetaryHours(validLatitude, validLongitude, validDate, timezone);
    
    if (planetaryHours.length === 0) {
      console.warn('No planetary hours calculated');
      return null;
    }
    
    // Find the current hour
    const currentHour = planetaryHours.find(hour => hour.isCurrentHour);
    
    if (currentHour) {
      console.log(`Found current hour: ${currentHour.hourNumber} (${currentHour.planet})`);
      return currentHour;
    } else {
      // Check if we need to look at the next or previous day
      const firstHour = planetaryHours[0];
      const lastHour = planetaryHours[planetaryHours.length - 1];
      const firstHourStart = DateTime.fromJSDate(firstHour.startTime);
      const lastHourEnd = DateTime.fromJSDate(lastHour.endTime);
      
      console.log(`First hour starts at: ${firstHourStart.toISO()}`);
      console.log(`Last hour ends at: ${lastHourEnd.toISO()}`);
      console.log(`Current time: ${now.toISO()}`);
      
      if (now > lastHourEnd) {
        // Calculate hours for next day
        console.log('Current time is after last hour, checking next day...');
        const nextDay = new Date(validDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return findCurrentPlanetaryHour(validLatitude, validLongitude, nextDay, timezone);
      } else if (now < firstHourStart) {
        // Calculate hours for previous day
        console.log('Current time is before first hour, checking previous day...');
        const prevDay = new Date(validDate);
        prevDay.setDate(prevDay.getDate() - 1);
        return findCurrentPlanetaryHour(validLatitude, validLongitude, prevDay, timezone);
      }
    }
    
    console.warn('Could not determine current planetary hour');
    return null;
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
