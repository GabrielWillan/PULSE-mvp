import { SafeAreaView } from 'react-native-safe-area-context';

import { TrainingLogView } from '@/components/pulse/TrainingLogView';
import { usePulseRoutines } from '@/components/pulse/PulseRoutinesContext';
import { PulseColors } from '@/constants/pulse-theme';

export default function TrainingLogRoute() {
  const { routines } = usePulseRoutines();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PulseColors.background }} edges={['top', 'left', 'right']}>
      <TrainingLogView routines={routines} />
    </SafeAreaView>
  );
}
