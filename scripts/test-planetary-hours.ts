import { DateTime } from 'luxon';
import { calculatePlanetaryHours } from '../app/services/planetaryHours';

// Coordinates for Monticello, UT
const MONTICELLO_LATITUDE = 37.8714;
const MONTICELLO_LONGITUDE = -109.3425;
const TIMEZONE = 'America/Denver';

// Today's date
const TODAY = new Date();

async function testPlanetaryHours() {
  console.log('Testing Planetary Hours Calculation');
  console.log('----------------------------------');
  console.log(`Location: Monticello, UT (${MONTICELLO_LATITUDE}, ${MONTICELLO_LONGITUDE})`);
  console.log(`Date: ${TODAY.toLocaleDateString()}`);
  console.log(`Timezone: ${TIMEZONE}`);
  console.log('----------------------------------');

  try {
    const hours = await calculatePlanetaryHours(
      MONTICELLO_LATITUDE,
      MONTICELLO_LONGITUDE,
      TODAY,
      TIMEZONE
    );

    console.log('\nPlanetary Hours for Today:');
    console.log('----------------------------------');
    
    hours.forEach((hour, index) => {
      const startTime = DateTime.fromJSDate(hour.startTime).setZone(TIMEZONE);
      const endTime = DateTime.fromJSDate(hour.endTime).setZone(TIMEZONE);
      
      console.log(
        `Hour ${hour.hourNumber}: ${hour.planet.padEnd(8)} | ` +
        `${startTime.toFormat('HH:mm')} - ${endTime.toFormat('HH:mm')} | ` +
        `${hour.isDayHour ? 'Day Hour' : 'Night Hour'}`
      );
    });

    // Find the current hour
    const now = DateTime.local().setZone(TIMEZONE).toJSDate().getTime();
    const currentHour = hours.find(
      (hour) => now >= hour.startTime.getTime() && now < hour.endTime.getTime()
    );

    if (currentHour) {
      console.log('\nCurrent Planetary Hour:');
      console.log('----------------------------------');
      console.log(
        `${currentHour.planet} (Hour ${currentHour.hourNumber}) | ` +
        `${DateTime.fromJSDate(currentHour.startTime).setZone(TIMEZONE).toFormat('HH:mm')} - ` +
        `${DateTime.fromJSDate(currentHour.endTime).setZone(TIMEZONE).toFormat('HH:mm')} | ` +
        `${currentHour.isDayHour ? 'Day Hour' : 'Night Hour'}`
      );
    } else {
      console.log('\nNo current planetary hour found.');
    }
  } catch (error) {
    console.error('Error calculating planetary hours:', error);
  }
}

// Run the test
testPlanetaryHours();
