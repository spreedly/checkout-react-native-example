# React Native 0.79+ Requirement

## Summary

- **Minimum React Native:** **0.79.0**. Older releases are not supported.
- **Android:** Spreedly ships **Kotlin 2.3** native artifacts. On **0.79+**, the host app must pin three Gradle plugins on the **root** `buildscript` classpath to **`${kotlinVersion}`** (e.g. **2.3.10**): **`kotlin-gradle-plugin`**, **`kotlin-serialization`**, and **`compose-compiler-gradle-plugin`**. Setting **`ext.kotlinVersion`** alone does **not** upgrade the Kotlin compiler if **`kotlin-gradle-plugin`** is left unpinned (React Native’s default KGP is lower than Spreedly needs).
- **Where to configure:** copy the full **`android/build.gradle`** pattern from [Integration guide — Android setup](./integration_guide.md#5-android-setup). That page is the source of truth for snippets and rationale.

## Justification

### 1. Kotlin toolchain (React Native 0.79+)

Spreedly Android code targets **Kotlin stdlib 2.3.10** and needs matching compiler and plugin IDs (serialization, Compose) resolved from the **host** app. A library subproject cannot supply those plugins to the host.

**Optional compiler flag:** keep **`-Xskip-metadata-version-check`** on `KotlinCompile` via `compilerOptions { freeCompilerArgs.add(...) }` in a root `subprojects` block when you consume **Kotlin 2.3-metadata** libraries (common on **0.79+**).

The same Android setup section covers **kotlinx-serialization**, coroutines/flow usage in 3DS and payments, and the **`compilerOptions` vs `kotlinOptions`** note.

### 2. Security

**Recent React Native releases address:**

- Native bridge hardening
- Memory and TLS updates
- JavaScript engine improvements

**PCI-aligned posture:** supported stacks reduce known framework risk and align with common PCI DSS 4.0 expectations for maintained dependencies.

### 3. Architecture and performance

- **0.79+** is the supported baseline for Fabric / TurboModules with the Android classpath layout above.
- Typical RN upgrade benefits: faster startup, less bridge traffic with New Architecture enabled.

## Platform requirements

### Android

| Requirement           | Version / rule                                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| minSdkVersion         | **26**                                                                                                                                                                                         |
| targetSdkVersion      | **34**                                                                                                                                                                                         |
| compileSdkVersion     | **36**                                                                                                                                                                                         |
| Android Gradle Plugin | **8.10.1+** (AGP 8.9.x tops out at compileSdk **35** for some AAR metadata checks)                                                                                                             |
| Gradle (wrapper)      | **8.11.1+** — [AGP 8.10 release notes](https://developer.android.com/build/releases/agp-8-10-0-release-notes)                                                                                  |
| Kotlin stdlib         | **2.3.10** via `ext.kotlinVersion` in root `android/build.gradle`                                                                                                                              |
| Host `buildscript`    | Pin **`kotlin-gradle-plugin`**, **`kotlin-serialization`**, **`compose-compiler-gradle-plugin`** → **`${kotlinVersion}`** — details in [Android setup](./integration_guide.md#5-android-setup) |
| NDK                   | **27.1.12297006**                                                                                                                                                                              |

### iOS

| Requirement | Version   |
| ----------- | --------- |
| iOS         | **15.1+** |
| Xcode       | **15+**   |
| Swift       | **5.9+**  |

## Version compatibility

| React Native | Host `buildscript` classpath                                                                                          | AGP     | Gradle  | Status            |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | ------- | ------- | ----------------- |
| 0.79+        | **`kotlin-gradle-plugin`**, **`kotlin-serialization`**, **`compose-compiler-gradle-plugin`** → **`${kotlinVersion}`** | 8.10.1+ | 8.11.1+ | **Supported**     |
| < 0.79       | —                                                                                                                     | —       | —       | **Not supported** |

Gradle wrapper URL and full `android/build.gradle` example: [integration_guide.md — Android setup](./integration_guide.md#5-android-setup).

## Migration support

- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- Spreedly technical docs and engineering support for complex migrations

## Recommendation

Adopt **React Native 0.79+** for Spreedly SDK compatibility, security and performance on supported RN lines, and a maintained New Architecture baseline. Apply the Android versions and **`buildscript`** pins from [Android setup](./integration_guide.md#5-android-setup) when upgrading.

---

**Document Version:** 3.2  
**Last Updated:** June 2026
