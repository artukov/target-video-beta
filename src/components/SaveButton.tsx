import Check from 'lucide-react-native/icons/check';
import Plus from 'lucide-react-native/icons/plus';

import { useSession } from '@/session/SessionProvider';

import { CircleButton } from './Buttons';

interface Props {
  seriesId: string;
  notify: (message: string) => void;
}

export function SaveButton({ seriesId, notify }: Props) {
  const { session, toggleSaved } = useSession();
  const saved = session.savedSeriesIds.includes(seriesId);

  return (
    <CircleButton
      icon={saved ? Check : Plus}
      label={saved ? 'Remove from Library' : 'Save to Library'}
      active={saved}
      onPress={() => notify(toggleSaved(seriesId) ? 'Saved to your Library' : 'Removed from your Library')}
    />
  );
}
