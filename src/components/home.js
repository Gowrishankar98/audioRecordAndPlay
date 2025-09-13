import React from 'react';
import {
  Platform,
  Text,
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
  AppState,
} from 'react-native';
import { Icon, requestPermissionsForAudio } from '../../global';
import RNFS from 'react-native-fs';
import Sound from 'react-native-nitro-sound';

const Home = ({ navigation }) => {
  const [audioRecordStarted, setAudioRecordStarted] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [recordTime, setRecordTime] = React.useState('0:00');
  const [audioFileData, setAudioFileData] = React.useState({
    timer: null,
    isRecorded: false,
    tempAudioPath: '',
    showTempPlayer: false,
    recordingStartTime: null,
    backgroundTime: 0,
    lastBackgroundTime: null,
    micConflictDetected: false,
  });

  // Temp audio player state for preview before saving
  const [tempAudioPlayer, setTempAudioPlayer] = React.useState({
    isPlaying: false,
    isPaused: false,
    duration: 0,
    currentTime: 0,
  });

  // NitroSound instances
  const [nitroSound, setNitroSound] = React.useState(null);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (audioFileData.timer) {
        clearInterval(audioFileData.timer);
      }
    };
  }, [audioFileData.timer]);

  // Initialize NitroSound instance
  React.useEffect(() => {
    const initializeNitroSound = async () => {
      try {
        const sound = Sound;
        setNitroSound(sound);
      } catch (error) {
        console.error('Error initializing NitroSound:', error);
      }
    };

    initializeNitroSound();

    return () => {
      // Cleanup on unmount
      if (nitroSound) {
        nitroSound.stopRecorder();
        nitroSound.stopPlayer();
      }
    };
  }, [nitroSound]);

  // Handle app state changes for background timer
  React.useEffect(() => {
    const handleAppStateChange = nextAppState => {
      // Only track background time when actively recording (not paused)
      if (recording && !paused) {
        if (nextAppState === 'background') {
          // App went to background - record the time
          const currentTime = Date.now();
          setAudioFileData(prev => ({
            ...prev,
            lastBackgroundTime: currentTime,
          }));
          console.log(
            'App went to background, recording state:',
            recording ? 'active' : 'paused',
          );
        } else if (nextAppState === 'active') {
          // App came back to foreground - calculate background time
          const currentTime = Date.now();
          setAudioFileData(prev => {
            if (prev.lastBackgroundTime) {
              const backgroundDuration = Math.floor(
                (currentTime - prev.lastBackgroundTime) / 1000,
              );
              return {
                ...prev,
                backgroundTime: prev.backgroundTime + backgroundDuration,
                lastBackgroundTime: null,
              };
            }
            return prev;
          });
          console.log(
            'App returned to foreground, recording state:',
            recording ? 'active' : 'paused',
          );
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [recording, paused]);

  // Handle microphone conflicts (phone calls, camera apps, etc.)
  React.useEffect(() => {
    const handleMicrophoneConflict = async () => {
      if (recording && !paused) {
        console.log('Microphone conflict detected - auto-stopping recording');

        // Auto-stop recording and save to temp player
        setRecording(false);
        setPaused(false);
        setRecordTime('0:00');

        // Clear timer
        if (audioFileData.timer) {
          clearInterval(audioFileData.timer);
        }

        // Stop NitroSound recording and get the audio file
        try {
          if (nitroSound) {
            const audioFile = await nitroSound.stopRecorder();

            // Update the temp audio path with the actual file path
            if (audioFile) {
              setAudioFileData(prev => ({ ...prev, tempAudioPath: audioFile }));

              // Get duration by briefly starting the player
              try {
                // Set subscription duration for regular updates
                nitroSound.setSubscriptionDuration(0.1);

                // Add playback listener to get duration
                nitroSound.addPlayBackListener(playbackMeta => {
                  setTempAudioPlayer(prev => ({
                    ...prev,
                    duration: playbackMeta.duration,
                  }));
                });

                // Start player briefly to get duration
                await nitroSound.startPlayer(audioFile);

                // Stop immediately after getting duration
                setTimeout(async () => {
                  await nitroSound.stopPlayer();
                  nitroSound.removePlayBackListener();
                }, 100);
              } catch (durationError) {
                console.error('Error getting duration:', durationError);
              }
            }
          }
        } catch (error) {
          console.error(
            'Error stopping NitroSound recording due to mic conflict:',
            error,
          );
        }

        // Update state to show temp player
        setAudioFileData(prev => ({
          ...prev,
          isRecorded: true,
          timer: null,
          showTempPlayer: true,
          micConflictDetected: true,
        }));

        // Reset background time tracking
        setAudioFileData(prev => ({
          ...prev,
          recordingStartTime: null,
          backgroundTime: 0,
          lastBackgroundTime: null,
        }));

        // Show user notification
        Alert.alert(
          'Recording Stopped',
          'Recording was automatically stopped due to microphone conflict (phone call, camera app, etc.). Your partial recording is saved and ready to play.',
          [{ text: 'OK' }],
        );
      }
    };

    const handleMicrophoneAvailable = () => {
      if (audioFileData.micConflictDetected) {
        console.log('Microphone available again - ready for new recording');

        // Update state to indicate mic is available
        setAudioFileData(prev => ({
          ...prev,
          micConflictDetected: false,
        }));

        // Show user notification
        Alert.alert(
          'Microphone Available',
          'Microphone is now available. You can start a new recording.',
          [{ text: 'OK' }],
        );
      }
    };

    // Set up microphone conflict detection
    let micConflictListener = null;
    let micAvailableListener = null;

    if (nitroSound) {
      try {
        // Listen for audio session interruptions (iOS/Android)
        if (Platform.OS === 'ios') {
          // iOS audio session interruption events
          micConflictListener = nitroSound.addAudioSessionInterruptionListener(
            handleMicrophoneConflict,
          );
          micAvailableListener = nitroSound.addAudioSessionResumeListener(
            handleMicrophoneAvailable,
          );
        } else {
          // Android audio focus change events
          micConflictListener = nitroSound.addAudioFocusChangeListener(
            focusChange => {
              if (
                focusChange === 'AUDIOFOCUS_LOSS' ||
                focusChange === 'AUDIOFOCUS_LOSS_TRANSIENT'
              ) {
                handleMicrophoneConflict();
              } else if (focusChange === 'AUDIOFOCUS_GAIN') {
                handleMicrophoneAvailable();
              }
            },
          );
        }
      } catch (error) {
        console.log(
          'Audio session listeners not available, using fallback method',
        );

        // Fallback: Monitor app state changes more aggressively
        const aggressiveAppStateListener = AppState.addEventListener(
          'change',
          nextAppState => {
            if (nextAppState === 'background' && recording && !paused) {
              // Check if it's likely a phone call or camera app
              setTimeout(() => {
                if (recording && !paused) {
                  handleMicrophoneConflict();
                }
              }, 1000); // Give a short delay to detect the conflict
            }
          },
        );

        return () => {
          aggressiveAppStateListener?.remove();
        };
      }
    }

    return () => {
      micConflictListener?.remove();
      micAvailableListener?.remove();
    };
  }, [
    recording,
    paused,
    nitroSound,
    audioFileData.micConflictDetected,
    audioFileData.timer,
    recordTime,
  ]);

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissionsForAudio();

      if (!hasPermission) {
        setAudioRecordStarted(false);
        Alert.alert(
          'Permission Denied',
          'Microphone permission is required to record audio.',
        );
        return;
      }

      setRecording(true);
      setPaused(false);
      setAudioRecordStarted(true);

      // Record the start time for background timer calculation
      const startTime = Date.now();
      setAudioFileData(prev => ({
        ...prev,
        recordingStartTime: startTime,
        backgroundTime: 0,
        lastBackgroundTime: null,
        micConflictDetected: false,
        autoPausedDueToConflict: false,
      }));

      if (!nitroSound) {
        Alert.alert('Recorder Error', 'Audio recorder not initialized');
        return;
      }

      // Create temporary audio file path
      const tempAudioPath =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/temp_audio_${Date.now()}.m4a`
          : `${RNFS.ExternalDirectoryPath}/temp_audio_${Date.now()}.m4a`;

      setAudioFileData(prev => {
        return { ...prev, tempAudioPath };
      });

      // Start actual audio recording with NitroSound
      try {
        if (nitroSound) {
          await nitroSound.startRecorder(tempAudioPath);
        }
      } catch (recordError) {
        console.error('Error starting NitroSound recording:', recordError);
        Alert.alert('Recording Error', 'Failed to start microphone recording');
        setRecording(false);
        setAudioRecordStarted(false);
        return;
      }

      // Recording timer with background support
      const timer = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = Math.floor((currentTime - startTime) / 1000);
        const totalElapsedTime = elapsedTime + audioFileData.backgroundTime;

        const minutes = Math.floor(totalElapsedTime / 60);
        const remainingSeconds = totalElapsedTime % 60;
        setRecordTime(
          `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`,
        );
      }, 1000);

      // Store timer reference for cleanup
      setAudioFileData(prev => ({ ...prev, timer }));
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;

    setPaused(true);
    setRecording(false);

    // Pause real audio recording with NitroSound
    try {
      if (nitroSound) {
        await nitroSound.pauseRecorder();
      }
    } catch (error) {
      console.error('Error pausing NitroSound recording:', error);
    }

    // Clear the timer
    if (audioFileData.timer) {
      clearInterval(audioFileData.timer);
      setAudioFileData(prev => ({
        ...prev,
        timer: null,
      }));
    }
  };

  const resumeRecording = async () => {
    if (!paused) return;

    setPaused(false);
    setRecording(true);

    // Resume real audio recording with NitroSound
    try {
      if (nitroSound) {
        await nitroSound.resumeRecorder();
      }
    } catch (error) {
      console.error('Error resuming NitroSound recording:', error);
    }

    // Parse current recordTime to get the exact paused time
    let currentSeconds = 0;
    if (recordTime.includes(':')) {
      // Format: "1:30" or "0:05"
      const parts = recordTime.split(':');
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      currentSeconds = minutes * 60 + seconds;
    } else if (recordTime.includes('m')) {
      // Format: "1m 30s" (legacy format)
      const parts = recordTime.split('m ');
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1].replace('s', ''), 10) || 0;
      currentSeconds = minutes * 60 + seconds;
    } else {
      // Format: "30s" (legacy format)
      currentSeconds = parseInt(recordTime.replace('s', ''), 10) || 0;
    }

    // Start timer from the exact paused time using timestamp approach
    const resumeStartTime = Date.now();
    const pausedDuration = currentSeconds * 1000; // Convert to milliseconds

    // Immediately display the current paused time (background time only added during active recording)
    const initialMinutes = Math.floor(currentSeconds / 60);
    const initialRemainingSeconds = currentSeconds % 60;
    const initialTimeString = `${initialMinutes}:${initialRemainingSeconds
      .toString()
      .padStart(2, '0')}`;
    setRecordTime(initialTimeString);

    const timer = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = Math.floor((currentTime - resumeStartTime) / 1000);
      const totalElapsedTime =
        pausedDuration / 1000 + elapsedTime + audioFileData.backgroundTime;

      const minutes = Math.floor(totalElapsedTime / 60);
      const remainingSeconds = Math.floor(totalElapsedTime % 60);
      const timeString = `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
      setRecordTime(timeString);
    }, 1000);

    setAudioFileData(prev => ({ ...prev, timer }));
  };

  const stopRecording = async () => {
    if (!recording && !paused) return;

    setRecording(false);
    setPaused(false);
    setRecordTime('0:00');

    // Reset background time tracking and microphone conflict state
    setAudioFileData(prev => ({
      ...prev,
      recordingStartTime: null,
      backgroundTime: 0,
      lastBackgroundTime: null,
      micConflictDetected: false,
      autoPausedDueToConflict: false,
    }));

    // Clear timer
    if (audioFileData.timer) {
      clearInterval(audioFileData.timer);
    }

    // Stop NitroSound recording
    try {
      if (nitroSound) {
        const audioFile = await nitroSound.stopRecorder();

        // Update the temp audio path with the actual file path
        if (audioFile) {
          setAudioFileData(prev => ({ ...prev, tempAudioPath: audioFile }));

          // Get duration by briefly starting the player
          try {
            // Set subscription duration for regular updates
            nitroSound.setSubscriptionDuration(0.1);

            // Add playback listener to get duration
            nitroSound.addPlayBackListener(playbackMeta => {
              setTempAudioPlayer(prev => ({
                ...prev,
                duration: playbackMeta.duration,
              }));
            });

            // Start player briefly to get duration
            await nitroSound.startPlayer(audioFile);

            // Stop immediately after getting duration
            setTimeout(async () => {
              await nitroSound.stopPlayer();
              nitroSound.removePlayBackListener();
            }, 100);
          } catch (durationError) {
            console.error('Error getting duration:', durationError);
          }
        }
      }
    } catch (error) {
      console.error('Error stopping NitroSound recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording properly');
    }

    setAudioFileData(prev => ({
      ...prev,
      isRecorded: true,
      timer: null,
      showTempPlayer: true, // Show temp player for preview
    }));
  };

  const saveAudio = async () => {
    if (!audioFileData.isRecorded || !audioFileData.tempAudioPath) {
      Alert.alert('No Recording', 'No audio recorded to save.');
      return;
    }

    try {
      // Check if temp file exists
      const tempFileExists = await RNFS.exists(audioFileData.tempAudioPath);

      if (!tempFileExists) {
        Alert.alert('File Not Found', 'Temporary audio file not found.');
        setAudioFileData(prev => ({
          ...prev,
          isRecorded: false,
          tempAudioPath: '',
        }));
        return;
      }

      // Create final audio file path
      const finalAudioPath =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/audio_${Date.now()}.m4a`
          : `${
              RNFS.ExternalStorageDirectoryPath
            }/Download/audio_${Date.now()}.mp3`;

      // Ensure Download directory exists (Android only)
      if (Platform.OS === 'android') {
        const downloadDir = `${RNFS.ExternalStorageDirectoryPath}/Download`;
        const dirExists = await RNFS.exists(downloadDir);
        if (!dirExists) {
          await RNFS.mkdir(downloadDir);
        }
      }

      // Copy temp file to final location
      await RNFS.copyFile(audioFileData.tempAudioPath, finalAudioPath);

      // Delete temp file
      await RNFS.unlink(audioFileData.tempAudioPath);

      setAudioFileData(prev => ({
        ...prev,
        isRecorded: false,
        tempAudioPath: '',
        showTempPlayer: false,
      }));

      // Reset temp audio player
      setTempAudioPlayer({
        isPlaying: false,
        isPaused: false,
        duration: 0,
        currentTime: 0,
      });
      setAudioRecordStarted(false);

      Alert.alert('Audio Saved', `Audio saved to: ${finalAudioPath}`);
    } catch (error) {
      console.error('Error saving audio:', error);
      Alert.alert('Save Error', 'Failed to save audio file.');
    }
  };

  const discardAudio = async () => {
    if (!audioFileData.isRecorded || !audioFileData.tempAudioPath) {
      Alert.alert('No Recording', 'No audio recorded to discard.');
      return;
    }

    try {
      // Check if file exists before trying to delete
      const fileExists = await RNFS.exists(audioFileData.tempAudioPath);

      if (fileExists) {
        await RNFS.unlink(audioFileData.tempAudioPath);
      } else {
      }

      setAudioFileData(prev => ({
        ...prev,
        isRecorded: false,
        tempAudioPath: '',
        showTempPlayer: false,
      }));

      // Reset temp audio player
      setTempAudioPlayer({
        isPlaying: false,
        isPaused: false,
        duration: 0,
        currentTime: 0,
      });
      setAudioRecordStarted(false);
      Alert.alert('Audio Discarded', 'Recording has been discarded.');
    } catch (error) {
      console.error('Error discarding audio:', error);
      // Even if file deletion fails, reset the state
      setAudioFileData(prev => ({
        ...prev,
        isRecorded: false,
        tempAudioPath: '',
        showTempPlayer: false,
      }));

      // Reset temp audio player
      setTempAudioPlayer({
        isPlaying: false,
        isPaused: false,
        duration: 0,
        currentTime: 0,
      });

      Alert.alert('Audio Discarded', 'Recording has been discarded.');
    }
  };

  // Temp Audio Player Functions for Preview
  const playTempAudio = async () => {
    if (!audioFileData.tempAudioPath) {
      Alert.alert('No Audio', 'No temporary audio file to play.');
      return;
    }

    // Check if temp file exists first
    try {
      const fileExists = await RNFS.exists(audioFileData.tempAudioPath);
      if (!fileExists) {
        Alert.alert(
          'Demo Mode',
          'This is a demo without real audio recording. In a real app, your recorded audio would play here. You can still test the Save/Discard functionality.',
          [
            {
              text: 'Continue Demo',
              onPress: () => {},
            },
          ],
        );
        return;
      }
    } catch (error) {
      console.error('Error checking file existence:', error);
      Alert.alert(
        'Demo Mode',
        'This is a demo app. In a real implementation, actual recorded audio would be played here.',
        [
          {
            text: 'Continue Demo',
            onPress: () => {},
          },
        ],
      );
      return;
    }

    try {
      // Use NitroSound for temp audio playback
      try {
        if (nitroSound) {
          // Set subscription duration for regular updates
          nitroSound.setSubscriptionDuration(0.1); // Update every 100ms

          // Add playback listener to track progress
          nitroSound.addPlayBackListener(playbackMeta => {
            setTempAudioPlayer(prev => ({
              ...prev,
              currentTime: playbackMeta.currentPosition,
              duration: playbackMeta.duration,
            }));
          });

          // Add playback end listener to reset button state
          nitroSound.addPlaybackEndListener(playbackEndMeta => {
            setTempAudioPlayer(prev => ({
              ...prev,
              isPlaying: false,
              isPaused: false,
              currentTime: 0,
            }));
          });

          await nitroSound.startPlayer(audioFileData.tempAudioPath);

          setTempAudioPlayer(prev => ({
            ...prev,
            isPlaying: true,
            isPaused: false,
          }));
        }
      } catch (error) {
        console.error('Error playing temp audio with NitroSound:', error);
        Alert.alert(
          'Playback Error',
          'Failed to play recorded audio. The file may not be ready yet.',
          [
            {
              text: 'OK',
              onPress: () => {},
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error playing temp audio:', error);
      Alert.alert('Playback Error', 'Failed to play temporary audio');
    }
  };

  const pauseTempAudio = async () => {
    if (nitroSound && tempAudioPlayer.isPlaying) {
      try {
        await nitroSound.pausePlayer();
        setTempAudioPlayer(prev => ({
          ...prev,
          isPlaying: false,
          isPaused: true,
        }));
      } catch (error) {
        console.error('Error pausing temp audio:', error);
      }
    }
  };

  const stopTempAudio = async () => {
    if (nitroSound) {
      try {
        await nitroSound.stopPlayer();

        // Remove listeners to prevent memory leaks
        nitroSound.removePlayBackListener();
        nitroSound.removePlaybackEndListener();

        setTempAudioPlayer(prev => ({
          ...prev,
          isPlaying: false,
          isPaused: false,
          currentTime: 0,
        }));
      } catch (error) {
        console.error('Error stopping temp audio:', error);
      }
    }
  };

  const formatTime = seconds => {
    const secs = Math.floor(seconds / 1000);
    const mins = Math.floor(secs / 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {!audioFileData.isRecorded && (
        <Text style={styles.title}> {recordTime}</Text>
      )}

      {/* Partial recording indicator */}
      {audioFileData.micConflictDetected && audioFileData.showTempPlayer && (
        <View style={styles.conflictIndicator}>
          <Icon family="material" name="mic-off" size={20} color="#FF5722" />
          <Text style={styles.conflictText}>
            Partial recording saved due to microphone conflict
          </Text>
        </View>
      )}
      {!audioRecordStarted && (
        <TouchableOpacity onPress={startRecording} style={styles.recordButton}>
          <Icon family="material" name="mic" size={32} color="white" />
          <Text style={styles.recordButtonText}>Record</Text>
        </TouchableOpacity>
      )}

      {recording && (
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={pauseRecording} style={styles.pauseButton}>
            <Text style={styles.pauseButtonText}>Pause</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {paused && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={resumeRecording}
            style={styles.resumeButton}
          >
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={stopRecording} style={styles.stopButton}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Temp Audio Player for Preview */}
      {audioFileData.showTempPlayer && (
        <View style={styles.tempPlayerContainer}>
          <Text style={styles.tempPlayerTitle}>
            {audioFileData.micConflictDetected
              ? '🎵 Partial Recording'
              : '🎵 Preview Your Recording'}
          </Text>
          <Text style={styles.tempPlayerSubtitle}>
            {audioFileData.micConflictDetected
              ? 'Recording was stopped due to microphone conflict. Listen to your partial recording.'
              : 'Listen to your recording before saving'}
          </Text>
          {/* Temp Audio Player Controls */}
          <View style={styles.tempPlayerContent}>
            {/* Time Display */}
            <View style={styles.tempPlayerTimeRow}>
              <Text style={styles.tempPlayerTimeText}>
                {formatTime(tempAudioPlayer.currentTime)} /{' '}
                {formatTime(tempAudioPlayer.duration)}
              </Text>
            </View>

            {/* Play Controls */}
            <View style={styles.tempPlayerControls}>
              {!tempAudioPlayer.isPlaying ? (
                <TouchableOpacity
                  onPress={playTempAudio}
                  style={styles.tempPlayButton}
                >
                  <Icon
                    family="material"
                    name="play-arrow"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={pauseTempAudio}
                  style={styles.tempPauseButton}
                >
                  <Icon
                    family="material"
                    name="pause"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={stopTempAudio}
                style={styles.tempStopButton}
              >
                <Icon family="material" name="stop" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Save/Discard buttons when recording is completed */}
      {audioFileData.isRecorded && (
        <View style={styles.saveDiscardRow}>
          <TouchableOpacity onPress={saveAudio} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Audio</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={discardAudio} style={styles.discardButton}>
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 10,
    fontSize: 20,
    fontWeight: 'bold',
  },
  recordButton: {
    width: 100,
    height: 100,
    backgroundColor: 'green',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  pauseButton: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    padding: 10,
    backgroundColor: 'orange',
    borderRadius: 5,
  },
  pauseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stopButton: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    marginLeft: 10,
  },
  stopButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resumeButton: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'green',
    marginRight: 10,
    borderRadius: 5,
  },
  resumeButtonText: {
    color: 'white',
  },
  tempPlayerContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    width: '90%',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  tempPlayerTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  tempPlayerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  tempPlayerContent: {
    alignItems: 'center',
  },
  tempPlayerTimeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tempPlayerTimeText: {
    fontSize: 14,
    color: '#333',
  },
  tempPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tempPlayButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 50,
    marginHorizontal: 10,
  },
  tempPauseButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 50,
    marginHorizontal: 10,
  },
  tempStopButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 50,
    marginHorizontal: 10,
  },
  saveDiscardRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  saveButton: {
    width: '30%',
    marginRight: 10,
    padding: 15,
    backgroundColor: 'green',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  discardButton: {
    width: '30%',
    padding: 15,
    backgroundColor: 'red',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  conflictIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  conflictText: {
    color: '#FF5722',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default Home;
