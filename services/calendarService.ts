import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { PlanetaryHour, PlanetDay as PlanetDayType } from '@/types';

// Define a custom interface for planetary day event
interface PlanetaryDayEvent {
  planet: {
    id: PlanetDayType;
    name: string;
  };
  date: string;
}

/**
 * Request permission to access the device calendar
 * @returns Promise<boolean> - True if permission is granted
 */
export const requestCalendarPermission = async (): Promise<boolean> => {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
};

/**
 * Get the default calendar for the device
 * @returns Promise<string> - Calendar ID
 */
export const getDefaultCalendarId = async (): Promise<string> => {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  
  // Find the default calendar
  const defaultCalendar = calendars.find(calendar => 
    Platform.OS === 'ios' 
      ? calendar.source.name === 'Default' && calendar.allowsModifications
      : calendar.accessLevel === Calendar.CalendarAccessLevel.OWNER && 
        calendar.allowsModifications
  );
  
  // If no default calendar is found, use the first calendar that allows modifications
  const fallbackCalendar = calendars.find(calendar => calendar.allowsModifications);
  
  if (!defaultCalendar && !fallbackCalendar) {
    throw new Error('No writable calendar found on device');
  }
  
  return (defaultCalendar || fallbackCalendar)?.id || '';
};

/**
 * Add a planetary day event to the calendar
 * @param planetaryDay - The planetary day to add
 * @returns Promise<string> - Event ID
 */
export const addPlanetaryDayToCalendar = async (
  planetaryDay: PlanetaryDayEvent
): Promise<string> => {
  try {
    const calendarId = await getDefaultCalendarId();
    
    // Create start and end dates for the event (full day)
    const startDate = new Date(planetaryDay.date);
    const endDate = new Date(planetaryDay.date);
    endDate.setDate(endDate.getDate() + 1); // End date is exclusive
    
    // Create event details
    const eventDetails = {
      title: `${planetaryDay.planet.name} Day`,
      notes: `This is a ${planetaryDay.planet.name} day. Rituals and activities associated with ${planetaryDay.planet.name} are more effective today.`,
      startDate,
      endDate,
      allDay: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    // Create the event
    const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
    return eventId;
  } catch (error) {
    console.error('Error adding planetary day to calendar:', error);
    throw error;
  }
};

/**
 * Add a planetary hour event to the calendar
 * @param planetaryHour - The planetary hour to add
 * @returns Promise<string> - Event ID
 */
export const addPlanetaryHourToCalendar = async (
  planetaryHour: PlanetaryHour
): Promise<string> => {
  try {
    const calendarId = await getDefaultCalendarId();
    
    // Create start and end dates for the event
    const startDate = new Date(planetaryHour.startTime);
    const endDate = new Date(planetaryHour.endTime);
    
    // Create event details
    const eventDetails = {
      title: `${planetaryHour.planet} Hour`,
      notes: `This is a ${planetaryHour.planet} hour. Rituals and activities associated with ${planetaryHour.planet} are more effective during this time.`,
      startDate,
      endDate,
      allDay: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    // Create the event
    const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
    return eventId;
  } catch (error) {
    console.error('Error adding planetary hour to calendar:', error);
    throw error;
  }
};
