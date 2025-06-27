# Yabble - Your Personal Audiobook Creator

Yabble is a mobile application built with React Native and Expo that transforms text-based content into high-quality, AI-generated audiobooks. Users can create private audiobooks from text, files, or URLs, customize them with different voices and background sounds, and share their creations with the community.

## ✨ Features

- **Audiobook Creation**:
  - **Multiple Sources**: Create audiobooks by pasting text, uploading files (`.txt`, `.pdf`, `.docx`), or (soon) from a URL.
  - **AI Voices**: Choose from a selection of high-quality AI-powered voices.
  - **Background Audio**: Enhance your audiobooks with background music and ambient sounds.
- **Personal Library**:
  - **Manage Your Books**: All created audiobooks are stored in a personal library.
  - **Drafts & Completion**: The app tracks the creation progress, saving drafts automatically.
  - **Offline Listening**: Download your audiobooks for listening on the go.
- **The Community Hub**:
  - **Discover**: Explore audiobooks published by other users in a central hub.
  - **Curated Sections**: Find content in "Featured," "Trending," "Newly Published," and "Quick Listens" carousels.
  - **Bookmarking**: Save your favorite community audiobooks to your personal library.
- **User Profiles**:
  - **Customizable**: Users can set their name and profile picture.
  - **Stats**: Track the number of books you've created.
- **Modern Player**: A sleek, easy-to-use audio player to listen to your creations.

## 🚀 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Backend & Database**: [Supabase](https://supabase.io/) (Auth, Postgres Database, Storage)
- **UI**:
  - Core React Native components
  - Icons: [Lucide React Native](https://lucide.dev/)
  - Navigation: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Audio Generation**: [ElevenLabs API](https://elevenlabs.io/) for Text-to-Speech (TTS)

## 🛠️ Setup & Installation

To get this project running locally, follow these steps:

1.  **Clone the Repository**

    ```bash
    git clone <your-repository-url>
    cd Yabble
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

    or if you use Yarn:

    ```bash
    yarn install
    ```

3.  **Set Up Environment Variables**
    Create a `.env` file in the root of the project and add your Supabase and ElevenLabs API credentials:

    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
    ```

    You can find your Supabase URL and Anon Key in your Supabase project dashboard under **Project Settings > API**.

4.  **Set Up Supabase Buckets & Policies**
    The application requires two storage buckets (`avatars` and `cover-images`) with specific access policies. Run the SQL scripts provided in the `docs/supabase_setup.sql` file in your Supabase SQL Editor to configure them correctly.

5.  **Run the Application**
    ```bash
    npx expo start
    ```
    This will open the Expo development server. You can then run the app on an iOS simulator, Android emulator, or on your physical device using the Expo Go app.

## Usage

Once the app is running:

1. Sign up for a new account or sign in.
2. Navigate to the "Create" tab to start a new audiobook..
3. Choose your input method, add content, and select a voice and background audio.
4. Once created, your audiobook will appear in your "Library."
5. From the library, you can publish your audiobook to the "Hub" to share it with other users.
6. Explore the "Hub" to discover and bookmark audiobooks created by the community.

---
