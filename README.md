# Typed Vite React Template

A modern and well-configured starting point for your React projects, utilizing TypeScript, TailwindCSS, and other powerful tools to streamline your development experience.

## 🌟 Latest Updates

-   Added Star Wars API integration with search functionality
-   Implemented modern UI with glass morphism effects
-   Added form validation with profanity filter
-   Enhanced internationalization support (EN/KO)
-   Improved responsive design and animations

## ⚡ Quick Start

1. **Start a project**:

    ```bash
    vite create typed-vite-react .
    ```

2. **Install dependencies**:

    ```bash
    yarn install
    ```

3. **Run the development server**:
    ```bash
    yarn dev
    ```

## 🛠️ Scripts

| Command          | Description              |
| ---------------- | ------------------------ |
| `yarn dev`       | Start development server |
| `yarn build`     | Build for production     |
| `yarn preview`   | Preview production build |
| `yarn lint`      | Run ESLint and Prettier  |
| `yarn test`      | Run tests in watch mode  |
| `yarn test-once` | Run tests once           |
| `yarn prepare`   | Set up Husky git hooks   |

## 📚 Core Features

### Base Technologies

-   🚀 **Vite** - Next Generation Frontend Tooling
-   ⚛️ **React 19** - Latest React features
-   📘 **TypeScript** - Type-safe development
-   🎨 **TailwindCSS** - Utility-first styling

### Development Tools

| Tool                        | Purpose                | Version  |
| --------------------------- | ---------------------- | -------- |
| @commitlint/cli             | Commit linting         | ^19.5.0  |
| @eslint/js                  | JavaScript linting     | ^9.13.0  |
| @testing-library/react      | React testing          | ^16.0.1  |
| @testing-library/user-event | User event simulation  | ^14.5.2  |
| @vitejs/plugin-react-swc    | Fast React compilation | ^3.5.0   |
| autoprefixer                | CSS post-processing    | ^10.4.20 |
| eslint                      | Code linting           | ^9.13.0  |
| eslint-config-prettier      | Prettier integration   | ^9.1.0   |
| husky                       | Git hooks              | ^9.1.6   |
| msw                         | API mocking            | ^2.6.6   |
| postcss                     | CSS processing         | ^8.4.47  |
| prettier                    | Code formatting        | 3.3.3    |
| tailwindcss                 | Utility CSS framework  | ^3.4.14  |
| typescript                  | Type checking          | ~5.6.2   |
| vite                        | Build tool             | ^5.4.10  |
| vitest                      | Testing framework      | ^2.1.4   |

### Main Libraries

| Library                 | Purpose              | Version  |
| ----------------------- | -------------------- | -------- |
| @hookform/resolvers     | Form validation      | ^3.10.0  |
| @tanstack/react-query   | Data fetching        | ^5.62.2  |
| @tanstack/react-virtual | List virtualization  | ^3.10.9  |
| clsx                    | Class utilities      | ^2.1.1   |
| dayjs                   | Date handling        | ^1.11.13 |
| i18next                 | Internationalization | ^24.0.5  |
| jotai                   | State management     | ^2.10.3  |
| ky                      | HTTP client          | ^1.7.2   |
| lucide-react            | Icons                | ^0.465.0 |
| react                   | UI Library           | ^19.0.0  |
| react-dom               | DOM rendering        | ^19.0.0  |
| react-hook-form         | Form management      | ^7.54.2  |
| react-i18next           | React i18n bindings  | ^15.1.3  |
| react-router            | Routing              | ^7.0.2   |
| tailwind-merge          | Tailwind utilities   | ^2.5.5   |
| zod                     | Schema validation    | ^3.23.8  |

## 🎨 UI Features

### Modern Design Elements

-   Gradient backgrounds and text effects
-   Glass morphism with backdrop blur
-   Smooth animations and transitions
-   Responsive layout
-   Interactive hover states

### Components

-   🔍 Real-time search with dropdown
-   📋 Virtualized lists
-   📝 Validated forms
-   🌐 Language switcher
-   🎯 Interactive cards

## 🌐 Internationalization

Currently supports:

-   English (en)
-   Korean (ko)

Add more languages by extending the locales in `src/locales/`.

## 📁 Project Structure

## Features

-   **TypeScript**: Type-safe React application development.
-   **Vite**: Fast build and development setup.
-   **TailwindCSS**: Highly customizable CSS framework.
-   **ESLint and Prettier**: Code quality and formatting tools with preconfigured rules.
-   **Husky and Commitlint**: Enforce commit standards and hooks.
-   **Testing with Vitest and Testing Library**: A robust testing environment.
-   **React Router**: For navigation.
-   **Jotai**: State management.
-   **Day.js**: Date and time manipulation.
-   **TanStack Tools**:
    -   React Query: For server state management.
    -   React Virtual: For virtualizing large lists.
-   **Zod**: Schema validation.
-   **Clsx and Tailwind Merge**: Utility for conditional class management.
-   **i18next**: Internationalization support for multiple languages.

## Customization

You can easily add or remove libraries to fit your project's needs. The template provides a flexible and extendable foundation for any React application.

## Contributing

Feel free to contribute to this template by submitting pull requests or opening issues. Let's build a better React development experience together!

## License

This project is open-source and available under the [MIT License](LICENSE).
