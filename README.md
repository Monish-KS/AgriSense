# AgriSense

AgriSense is an application designed to provide tools and insights for agricultural management. It includes features for crop recommendations, visualization of agricultural data, and processing of various datasets relevant to farming.

## Features

*   **Crop Recommendation:** Provides recommendations based on specific parameters.
*   **Crop Production Mapping:** Visualizes crop production data geographically.
*   **Centre Pivot Visualization:** Displays visualizations related to centre pivot irrigation systems.
*   **Data Processing Scripts:** Includes scripts for converting and processing agricultural datasets.

## Technologies Used

*   React
*   TypeScript
*   MapLibre GL JS
*   React LeafletQ
*   ONNX Runtime Web
*   Convex (for backend/database)
*   Firebase (for authentication/services)
*   Bun/Yarn/npm (package management)

## Setup and Installation

To set up the project locally, follow these steps:

1.  **Prerequisites:** Ensure you have Node.js and a package manager (Bun, Yarn, or npm) installed.
2.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd AgriSense
    ```
3.  **Install dependencies:** Navigate into the `agrisense` subdirectory and install the project dependencies.
    ```bash
    cd agrisense
    bun install # or yarn install or npm install
    ```
4.  **Environment Variables:** Create a `.env.local` file in the `agrisense` directory by copying the `.env.example` file. Update the variables with your specific configurations (e.g., Firebase credentials, Convex deployment URL).
    ```bash
    cp .env.example .env.local
    ```
5.  **Convex Setup:** If you are using Convex, set up your Convex project and link it to your local environment. Refer to the Convex documentation for detailed steps.
6.  **Firebase Setup:** If you are using Firebase, set up your Firebase project and configure the application with your project credentials. Refer to the Firebase documentation for detailed steps.

## Project Structure

The main parts of the project are organized as follows:

*   `agrisense/src/`: Contains the main application source code (React components, pages, hooks, etc.).
*   `agrisense/public/`: Static assets, including ONNX models, GeoJSON data, and images.
*   `agrisense/scripts/`: Node.js scripts used for data conversion and processing.
*   `agrisense/convex/`: Convex backend code (functions, schema).

## How to Run

After completing the setup, you can run the application in development mode from the `agrisense` subdirectory:

```bash
cd agrisense
bun dev # or yarn dev or npm run dev
```

This will start a local development server, and the application should be accessible in your web browser.

## Process

The project utilizes various processes, including:

*   **Data Conversion:** Scripts in the `scripts/` directory are used to convert raw data into formats suitable for the application.
*   **Model Inference:** ONNX models located in the `public/` directory are used for tasks like crop recommendations and fertilizer predictions, running directly in the browser using ONNX Runtime Web.
*   **Backend Interaction:** The application interacts with the Convex backend for data storage and server-side logic.
*   **Authentication:** Firebase is used for user authentication.