import { ActivityIndicator, View } from 'react-native';

/** Splash / loading screen shown while the auth gate determines where to redirect. */
export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
