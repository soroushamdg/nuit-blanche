# 🌙 Nuit Blanche Itinerary Planner

A full-stack Next.js web application built to streamline the process of planning a Nuit Blanche (Montréal en Lumière) itinerary. 

Instead of manually copy-pasting addresses and trying to figure out transit routes, this tool allows users to simply paste an event URL. The backend scrapes the page, uses AI to extract key details (like the nearest Montreal Metro station), geocodes the location, and plots it on an interactive map, saving the route locally.

## ✨ Features

* **Smart URL Scraping:** Feeds event page HTML into an LLM via the AI SDK to intelligently extract the title, description, address, and nearest metro station, bypassing the need for brittle CSS selectors.
* **Automated Geocoding:** Converts extracted street addresses into latitude and longitude coordinates using the OpenStreetMap Nominatim API.
* **Interactive Mapping:** Visualizes the itinerary on a dynamic map using `react-leaflet`, complete with custom markers and a polyline connecting the route.
* **Local Persistence:** Uses a local SQLite database managed by Prisma ORM, meaning the itinerary is saved securely on your machine without needing an external database provider.
* **Modern UI:** Built with Next.js App Router and styled with Tailwind CSS for a responsive, clean dashboard experience.

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router)
* **Database & ORM:** SQLite, Prisma
* **Mapping:** Leaflet, `react-leaflet`
* **Scraping & Parsing:** `cheerio`
* **AI Extraction:** AI SDK (`@ai-sdk/openai` or equivalent) + Zod for structured JSON output

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* An API key from your preferred LLM provider (e.g., OpenAI, Anthropic, or Google)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/nuit-blanche-planner.git](https://github.com/yourusername/nuit-blanche-planner.git)
    cd nuit-blanche-planner
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    Create a `.env` and `.env.local` file in the root directory.
    ```env
    # .env
    DATABASE_URL="file:./dev.db"
    
    # .env.local
    OPENAI_API_KEY="your_api_key_here"
    ```

4.  **Initialize the SQLite Database:**
    Generate the Prisma client and push the schema to create your local `dev.db` file.
    ```bash
    npx prisma db push
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 🧠 How it Works (The Pipeline)

1.  **Input:** User pastes a Montréal en Lumière event URL into the frontend.
2.  **Scrape:** The Next.js API route fetches the HTML and `cheerio` strips away unnecessary tags (like `<script>` and `<nav>`) to clean the text.
3.  **Extract:** The cleaned text is passed to an LLM with a strict Zod schema, forcing the AI to return a perfect JSON object containing the event's address and nearest Metro station.
4.  **Geocode:** The address string is sent to Nominatim to retrieve exact geographical coordinates.
5.  **Store & Render:** The final object is saved to the local SQLite database via Prisma, sent back to the client, and immediately plotted on the Leaflet map.

## 📝 License
This project is open-source and available under the MIT License.