import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  request,
  requestMultiple,
} from 'react-native-permissions';
import { Linking } from 'react-native';
import { Alert } from 'react-native';
import { PermissionsAndroid } from 'react-native';

const openSettingsOfApp = () => {
  Alert.alert(
    'Permissions Required',
    'To continue, please enable microphone, files, and media access in your settings',
    [
      {
        text: 'Cancel',
        onPress: () => null,
        style: 'cancel',
      },
      {
        text: 'Settings',
        onPress: () => Linking.openSettings(),
      },
    ],
    { cancelable: false },
  );
};
export const requestPermissionsForAudio = async () => {
  if (Platform.OS === 'android') {
    try {
      // Get Android API level
      const androidVersion = Platform.Version;
      console.log('Android API Level:', androidVersion);

      if (androidVersion < 33) {
        // Android 12 and below
        const permissionArray = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ];

        const granted = await PermissionsAndroid.requestMultiple(
          permissionArray,
        );
        console.log('Android < 13 Permissions:', granted);

        if (
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else if (
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
            PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
            PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
            PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ) {
          openSettingsOfApp();
          return false;
        } else {
          // Permission denied but can ask again
          return false;
        }
      } else {
        // Android 13 and above
        const permissionArray = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ];

        const granted = await PermissionsAndroid.requestMultiple(
          permissionArray,
        );
        console.log('Android >= 13 Permissions:', granted);

        if (
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else if (
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
            PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
          granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO] ===
            PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ) {
          openSettingsOfApp();
          return false;
        } else {
          // Permission denied but can ask again
          return false;
        }
      }
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  } else {
    // iOS
    try {
      const granted = await requestMultiple([PERMISSIONS.IOS.MICROPHONE]);
      console.log('iOS Permissions:', granted);

      if (granted[PERMISSIONS.IOS.MICROPHONE] === RESULTS.GRANTED) {
        return true;
      } else {
        openSettingsOfApp();
        return false;
      }
    } catch (err) {
      console.error('iOS Permission request error:', err);
      return false;
    }
  }
};
