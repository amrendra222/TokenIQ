# AlgoTrader - AI-Powered Trading Dashboard

Welcome to AlgoTrader, a high-performance trading dashboard featuring real-time market data integration with Delta Exchange and AI-powered strategy analysis.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **npm** or **yarn**

---

## 🚀 Quick Start (Production/Development)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/AlgoTrader.git
cd AlgoTrader
```

### 2. Backend Setup (FastAPI)
The backend handles real-time market data streaming and AI strategy parsing.

```bash
cd backend
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
export PYTHONPATH=$PYTHONPATH:.
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend will be available at `http://localhost:8000`.

### 3. Frontend Setup (Next.js)
The frontend provides a premium, real-time trading interface.

```bash
cd ../frontend

# Install dependencies
npm install

# Run the development server
npm run dev -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the dashboard.

---

## 🔧 Features

- **Real-Time Integration**: Directly connected to Delta Exchange via `ccxt`.
- **Dynamic Charting**: Built with `lightweight-charts` for smooth, low-latency performance.
- **AI Engine**: Integrated strategy parsing and multi-agent consensus simulation.
- **Premium UI**: Modern dark-mode aesthetic with glassmorphism and smooth animations.

## 🛠 Configuration (Optional)

To enable advanced features, create a `.env` file in the `backend` directory:

```env
DELTA_API_KEY=your_key
DELTA_API_SECRET=your_secret
OPENROUTER_API_KEY=your_key
```

---

*Built with ❤️ by the TokenIQ Team.*
