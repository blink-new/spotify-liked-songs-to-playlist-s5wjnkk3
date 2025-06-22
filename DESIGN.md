# Spotify Liked Songs to Playlist

## Design Vision
A beautiful, modern Spotify app that enables users to effortlessly transfer all their liked songs into a custom playlist. The design captures Spotify's signature aesthetic with glassmorphism elements, dark gradients, and vibrant green accents for a premium feel.

## Core Features

### 1. Spotify Authentication
- **OAuth Integration**: Secure Spotify login with proper scope permissions
- **User Profile Display**: Show connected user's profile picture and name
- **Connection Status**: Clear visual feedback of authentication state

### 2. Liked Songs Management
- **Preview Display**: Show preview of user's liked songs with album artwork
- **Song Details**: Display track name, artist, album, and duration
- **Total Count**: Clear indication of how many songs will be transferred

### 3. Playlist Creation
- **Custom Naming**: Allow users to name their new playlist
- **Transfer Process**: Visual progress indicator during playlist creation
- **Success Feedback**: Clear confirmation when transfer is complete
- **Multiple Playlists**: Support creating multiple playlists from the same liked songs

### 4. User Experience
- **Beautiful Animations**: Smooth transitions and hover effects
- **Loading States**: Proper loading indicators for all async operations
- **Error Handling**: Graceful error messages with actionable feedback
- **Responsive Design**: Mobile-first approach with tablet and desktop support

## Visual Style

### Design Language
- **Style**: Modern Glassmorphism with Spotify-inspired aesthetics
- **Color Palette**: 
  - Primary: Spotify Green (#1DB954)
  - Background: Purple-to-dark gradient
  - Cards: Semi-transparent black with backdrop blur
  - Text: White primary, gray secondary
- **Typography**: Clean, modern sans-serif with proper hierarchy
- **Shadows & Blur**: Subtle backdrop filters and soft shadows for depth

### Component Design
- **Cards**: Semi-transparent with rounded corners and subtle borders
- **Buttons**: Green primary buttons with hover states and loading indicators
- **Progress Bars**: Smooth animated progress with green accent color
- **Badges**: Status indicators with appropriate color coding
- **Images**: Rounded album artwork with proper aspect ratios

## Technical Architecture

### Frontend Stack
- **React 19** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **ShadCN UI** for consistent, accessible components
- **Lucide React** for beautiful icons
- **React Hot Toast** for user notifications

### Key Pages/Screens
1. **Authentication Screen**: Clean login interface with Spotify branding
2. **Dashboard**: Main interface showing user profile and liked songs preview
3. **Playlist Creation**: Form for naming and creating new playlists
4. **Success State**: Confirmation screen with options for additional actions

### Future Enhancements
- Real Spotify API integration (currently using mock data)
- Playlist management (edit, delete existing playlists)
- Song filtering and search within liked songs
- Export options (CSV, text file)
- Playlist sharing capabilities
- Dark/light theme toggle
- Advanced playlist customization options

## User Journey

1. **Landing**: User sees attractive authentication screen
2. **Connect**: User authorizes Spotify connection
3. **Review**: User sees their liked songs preview and count
4. **Create**: User names their playlist and initiates transfer
5. **Progress**: Visual feedback during playlist creation
6. **Success**: Confirmation with option to create additional playlists

This design prioritizes simplicity, beauty, and user delight while maintaining Spotify's familiar design patterns and interactions.