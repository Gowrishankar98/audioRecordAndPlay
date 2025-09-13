# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.yoga.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native FS
-keep class com.rnfs.** { *; }

# React Native Blob Util
-keep class com.reactnativeblobutil.** { *; }

# React Native Nitro Sound
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.nitro.** { *; }

# React Native Permissions
-keep class com.zoontek.rnpermissions.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Navigation
-keep class com.reactnavigation.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native bridge
-keep class com.facebook.react.bridge.** { *; }

# Keep Hermes
-keep class com.facebook.hermes.** { *; }
