import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from './ThemeProvider';
import { PlanetaryHour } from '../app/app-types';
import { formatHourTime } from '../utils/planetaryHours';
import { getPlanetById } from '../constants/planets';

interface PlanetaryHourListItemProps {
  hour: PlanetaryHour;
}

const PlanetaryHourListItem = ({ hour }: PlanetaryHourListItemProps) => {
  const { colors } = useTheme();
  
  // Get planet info
  const planet = getPlanetById(hour.planet);
  
  // Format hour number
  const formatHourNumber = (num: number) => {
    if (num <= 12) return `${num}`;
    return `${num - 12}`;
  };
  
  return (
    <View style={[
      styles.container,
      hour.isCurrentHour && [
        styles.currentHourContainer,
        { backgroundColor: `${colors.primary}10` }
      ]
    ]}>
      <View style={[
        styles.hourNumberContainer,
        { backgroundColor: hour.isCurrentHour ? colors.primary : `${colors.textSecondary}20` }
      ]}>
        <Text style={[
          styles.hourNumberText,
          { color: hour.isCurrentHour ? 'white' : colors.textSecondary }
        ]}>
          {formatHourNumber(hour.hourNumber)}
        </Text>
      </View>
      
      <View style={styles.hourInfoContainer}>
        <Text style={[
          styles.planetName,
          { color: planet?.color || colors.text }
        ]}>
          {planet?.name || hour.planet}
        </Text>
        
        <View style={styles.timeRow}> 
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatHourTime(hour.startTime)} - {formatHourTime(hour.endTime)}
          </Text>
          {hour.label && (
            <Text style={[styles.labelText, { color: colors.textSecondary }]}>
              ({hour.label})
            </Text>
          )}
        </View>
      </View>
      
      {hour.isCurrentHour && (
        <View style={[
          styles.currentIndicator,
          { backgroundColor: colors.primary }
        ]}>
          <Text style={styles.currentIndicatorText}>
            Now
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  currentHourContainer: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  hourNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hourNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  hourInfoContainer: {
    flex: 1,
  },
  planetName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
  },
  labelText: {
    fontSize: 12,
    marginLeft: 4,
  },
  currentIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PlanetaryHourListItem;