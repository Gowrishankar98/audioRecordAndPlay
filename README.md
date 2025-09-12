# 🎵 AudioPlay - React Native Audio Recording App

A modern, feature-rich audio recording application built with React Native, featuring real-time recording, playback controls, and file management capabilities.

## 📱 Features

### 🎙️ Audio Recording

- **Real-time Recording**: High-quality audio recording using device microphone
- **Pause/Resume**: Seamless pause and resume functionality during recording
- **Live Timer**: Real-time recording duration display (MM:SS format)
- **Permission Handling**: Automatic microphone permission requests with user-friendly prompts

### 🎵 Audio Playback

- **Preview Mode**: Listen to recordings before saving
- **Playback Controls**: Play, pause, stop, and seek functionality
- **Duration Display**: Shows current time and total duration
- **Auto-reset**: Play button resets to "Play" when audio finishes

### 💾 File Management

- **Temporary Storage**: Recordings stored locally for preview
- **Permanent Save**: Save recordings to device Download folder
- **File Organization**: Automatic file naming with timestamps
- **Discard Option**: Delete unwanted recordings without saving

### 🎨 User Interface

- **Modern Design**: Clean, intuitive interface with Material Design principles
- **Responsive Layout**: Optimized for different screen sizes
- **Visual Feedback**: Color-coded buttons and status indicators
- **Accessibility**: Screen reader friendly with proper labels

## 🛠️ Technical Stack

### Core Technologies

- **React Native**: 0.81.4
- **React**: 19.1.0
- **TypeScript**: 5.8.3
- **Node.js**: >=20

### Key Dependencies

- **Audio Processing**: `react-native-nitro-sound` - Modern audio recording/playback
- **File System**: `react-native-fs` - File operations and storage
- **Permissions**: `react-native-permissions` - Runtime permission handling
- **Navigation**: `@react-navigation/native` - App navigation
- **Icons**: `react-native-vector-icons` - Comprehensive icon library
- **UI Components**: `react-native-safe-area-context` - Safe area handling

### Development Tools

- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Metro**: React Native bundler

## 📁 Project Structure

```
audioPlay/
├── src/
│   ├── components/
│   │   └── home.js              # Main recording interface
│   ├── navigation/
│   │   └── appNavigation.js     # App navigation setup
│   ├── actions/
│   │   └── commonFunctions.js   # Utility functions & permissions
│   └── vectorIcons/
│       ├── Icon.js              # Universal icon component
│       └── index.js             # Icon exports
├── android/                     # Android-specific configuration
├── ios/                        # iOS-specific configuration
├── App.tsx                      # Main app component
├── global.js                   # Global exports
└── package.json                # Dependencies & scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd audioPlay
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **iOS Setup** (macOS only)

   ```bash
   cd ios && pod install && cd ..
   ```

4. **Run the application**

   ```bash
   # Android
   npm run android

   # iOS
   npm run ios
   ```

## 📱 Usage

### Recording Audio

1. **Start Recording**: Tap the green "Record" button
2. **Pause**: Tap "Pause" to temporarily stop recording
3. **Resume**: Tap "Resume" to continue from where you left off
4. **Stop**: Tap "Stop" to finish recording

### Preview & Save

1. **Preview**: After stopping, the recording automatically loads in preview mode
2. **Playback**: Use play/pause/stop controls to listen to your recording
3. **Save**: Tap "Save Audio" to permanently store the recording
4. **Discard**: Tap "Discard" to delete the recording without saving

### File Storage

- **Android**: Files saved to `/storage/emulated/0/Download/`
- **iOS**: Files saved to app's Documents directory
- **Format**: MP3 (Android) / M4A (iOS)
- **Naming**: `audio_[timestamp].mp3/m4a`

## 🔧 Configuration

### Permissions

The app automatically requests the following permissions:

**Android** (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

**iOS** (`ios/audioPlay/Info.plist`):

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone to record audio</string>
```

### Customization

- **Audio Quality**: Modify recording parameters in `home.js`
- **File Location**: Change storage paths in `saveAudio()` function
- **UI Themes**: Update colors in `StyleSheet` objects
- **Icon Sets**: Add more icon families in `Icon.js`

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Start Metro bundler
npm start
```

## 📦 Build & Deployment

### Android

```bash
# Debug build
npx react-native run-android

# Release build
cd android
./gradlew assembleRelease
```

### iOS

```bash
# Debug build
npx react-native run-ios

# Release build
# Use Xcode to build and archive
```

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied**

   - Ensure microphone permissions are granted
   - Check device settings for app permissions

2. **Build Errors**

   - Clean and rebuild: `npx react-native clean`
   - Reset Metro cache: `npx react-native start --reset-cache`

3. **Audio Not Recording**

   - Verify microphone hardware functionality
   - Check app permissions in device settings

4. **File Save Issues**
   - Ensure storage permissions are granted
   - Check available device storage space

### Debug Mode

```bash
# Enable debug logging
npx react-native start --reset-cache
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add comments for complex logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Native Community** for the excellent framework
- **Nitro Sound** for the modern audio library
- **Vector Icons** for comprehensive icon sets
- **React Navigation** for smooth navigation experience

## 📞 Support

For support, questions, or feature requests:

- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Made with ❤️ using React Native**
