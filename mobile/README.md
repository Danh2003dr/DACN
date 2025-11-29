# Drug Traceability System - Mobile App

Flutter mobile application for Drug Traceability Blockchain System.

## Architecture

This project follows **Clean Architecture** principles with the following structure:

```
lib/
├── core/           # Core utilities, constants, errors
├── config/         # Configuration (routes, theme, env)
├── data/           # Data layer (datasources, models, repositories)
├── domain/         # Domain layer (entities, usecases, repository interfaces)
└── presentation/   # Presentation layer (pages, widgets, blocs/providers)
```

## Setup

1. **Install Flutter SDK** (if not already installed)
   ```bash
   # Check Flutter installation
   flutter doctor
   ```

2. **Install Dependencies**
   ```bash
   cd mobile
   flutter pub get
   ```

3. **Setup Environment**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   
   # Edit .env with your configuration
   # API_BASE_URL=http://localhost:5000/api
   # ENV_TYPE=dev
   ```

4. **Generate Code** (for json_serializable, hive, etc.)
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

5. **Run the App**
   ```bash
   flutter run
   ```

## Project Structure

### Core Layer (`lib/core/`)
- **constants/**: App-wide constants
- **errors/**: Error classes and failure types
- **params/**: Request parameters
- **resources/**: Assets, strings, etc.
- **utils/**: Utility functions

### Config Layer (`lib/config/`)
- **routes/**: Navigation configuration (go_router)
- **theme/**: App theme (light/dark)
- **env/**: Environment configuration

### Data Layer (`lib/data/`)
- **datasources/**: Remote and local data sources
- **models/**: Data models (with json_serializable)
- **repositories_impl/**: Repository implementations

### Domain Layer (`lib/domain/`)
- **entities/**: Business entities
- **repositories_interfaces/**: Repository contracts
- **usecases/**: Business logic use cases

### Presentation Layer (`lib/presentation/`)
- **blocs/**: State management (Riverpod providers)
- **pages/**: Screen widgets
- **widgets/**: Reusable UI components

## Dependencies

### Core
- `dio`: HTTP client
- `flutter_riverpod`: State management
- `go_router`: Navigation
- `hive`: Local database
- `shared_preferences`: Key-value storage

### UI
- `flutter_svg`: SVG support
- `cached_network_image`: Image caching
- `flutter_animate`: Animations
- `shimmer`: Loading placeholders

### Features
- `mobile_scanner`: QR code scanning
- `local_auth`: Biometric authentication
- `firebase_messaging`: Push notifications
- `geolocator`: GPS tracking

## Development

### Running Tests
```bash
flutter test
```

### Building
```bash
# Android APK
flutter build apk --release

# iOS (requires macOS)
flutter build ios --release
```

## Notes

- Make sure to run `flutter pub get` after adding new dependencies
- Run `build_runner` when using code generation (json_serializable, hive)
- Update `.env` file with correct API URLs for different environments

