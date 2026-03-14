from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import asyncio
from trading_engine.strategy_parser import StrategyParser

app = FastAPI(title="AI Algo Crypto Trading API")
strategy_parser_instance = StrategyParser()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"message": "AI Algo Crypto Trading Engine is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

class StrategyRequest(BaseModel):
    strategy: str

@app.post("/api/strategy/parse")
def parse_strategy(req: StrategyRequest):
    result = strategy_parser_instance.parse_natural_language_strategy(req.strategy)
    return result

import random
from datetime import datetime

# Global state to simulate live portfolio evolution
portfolio_state = {
    "balance": 24850.00,
    "auto_trades_executed": 1402,
    "profit_factor": 1.84,
    "recent_trades": [
        { "id": 1, "type": "Buy", "asset": "BTC", "amount": "0.05", "price": 64200, "time": "2 mins ago", "pnl": "+ $124.50", "status": "profit" },
        { "id": 2, "type": "Sell", "asset": "ETH", "amount": "1.2", "price": 3450, "time": "1 hour ago", "pnl": "- $45.20", "status": "loss" },
        { "id": 3, "type": "Buy", "asset": "SOL", "amount": "15", "price": 142, "time": "3 hours ago", "pnl": "+ $89.00", "status": "profit" },
        { "id": 4, "type": "Sell", "asset": "BTC", "amount": "0.1", "price": 63800, "time": "1 day ago", "pnl": "+ $412.00", "status": "profit" },
    ]
}

import uuid

# In-memory storage for autonomous bots
bots_state = []

@app.get("/api/bots")
def get_bots():
    return bots_state

class BotRequest(BaseModel):
    asset: str
    strategy: str
    risk_level: str
    amount: float

@app.post("/api/bots/start")
def start_bot(req: BotRequest):
    new_bot = {
        "id": str(uuid.uuid4())[:8],
        "asset": req.asset,
        "strategy": req.strategy,
        "risk_level": req.risk_level,
        "amount": req.amount,
        "status": "Running",
        "started_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "profit_loss": 0.0,
        "trades_executed": 0
    }
    bots_state.append(new_bot)
    return {"message": "Bot started successfully", "bot": new_bot}

@app.post("/api/bots/stop/{bot_id}")
def stop_bot(bot_id: str):
    for bot in bots_state:
        if bot["id"] == bot_id:
            bot["status"] = "Stopped"
            return {"message": f"Bot {bot_id} stopped successfully", "bot": bot}
    return {"error": "Bot not found"}

# Simulated News and Social Media Data Pool
NEWS_HEADLINES = [
    {"source": "CoinDesk", "text": "Federal Reserve hints at future rate cuts, crypto markets surge.", "sentiment": 0.8},
    {"source": "Bloomberg", "text": "New SEC regulations proposed for stablecoins, uncertainty looms.", "sentiment": -0.4},
    {"source": "Twitter / X", "text": "Whale alert! 10,000 BTC moved to obscure exchange wallet.", "sentiment": -0.2},
    {"source": "CryptoSlate", "text": "Major institutional fund files for new Solana ETF.", "sentiment": 0.9},
    {"source": "Twitter / X", "text": "Just bought the dip! Bull market is back! 🚀", "sentiment": 0.7},
    {"source": "Reuters", "text": "European Union passes comprehensive MiCA crypto framework.", "sentiment": 0.5},
    {"source": "Twitter / X", "text": "Exchange hacked for $50M, funds drained.", "sentiment": -0.9},
    {"source": "TechCrunch", "text": "Web3 gaming startup raises $100M Series A.", "sentiment": 0.6},
    {"source": "Wall Street Journal", "text": "Inflation data comes in hotter than expected, Bitcoin drops.", "sentiment": -0.6},
    {"source": "Twitter / X", "text": "Consolidation phase continues, waiting for a breakout.", "sentiment": 0.1}
]

@app.get("/api/sentiment")
def get_sentiment(asset: str = "BTC/USDT"):
    # Generate 4-6 random news items for the live feed
    num_items = random.randint(4, 6)
    feed = random.sample(NEWS_HEADLINES, num_items)
    
    # Calculate synthetic global sentiment
    total_sentiment = sum(item["sentiment"] for item in feed)
    avg_sentiment = total_sentiment / num_items if num_items > 0 else 0
    
    # Map raw score (-1 to 1) to a 0-100 index (Fear & Greed style)
    sentiment_index = int(((avg_sentiment + 1) / 2) * 100)
    
    # Add fake timestamps
    current_time = datetime.now()
    response_feed = []
    for i, item in enumerate(feed):
        mins_ago = random.randint(1, 59)
        time_str = f"{mins_ago}m ago"
        response_feed.append({
            "id": i,
            "source": item["source"],
            "text": item["text"],
            "sentiment": item["sentiment"],
            "time": time_str
        })
        
    response_feed.sort(key=lambda x: int(x["time"].replace('m ago', '')))

    return {
        "asset": asset,
        "sentiment_index": sentiment_index,
        "global_label": "Greed" if sentiment_index >= 60 else ("Fear" if sentiment_index <= 40 else "Neutral"),
        "feed": response_feed,
        "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/api/multi-agent")
def get_multi_agent_consensus(asset: str = "BTC/USDT"):
    # Simulated Agent logic
    agents = [
        {
            "name": "Trend Follower",
            "type": "Technical",
            "signal": random.choice(["Buy", "Hold", "Sell"]),
            "confidence": random.randint(60, 95),
            "description": "Analyzes MA crossovers and ADX strength."
        },
        {
            "name": "Mean Reversion",
            "type": "Probabilistic",
            "signal": random.choice(["Buy", "Hold", "Sell"]),
            "confidence": random.randint(55, 90),
            "description": "Uses Bollinger Bands & RSI oversold/bought."
        },
        {
            "name": "Sentiment AI",
            "type": "NLP",
            "signal": random.choice(["Buy", "Hold", "Sell"]),
            "confidence": random.randint(70, 98),
            "description": "Neural parsing of Twitter & News streams."
        },
        {
            "name": "Arbitrage",
            "type": "Multi-Exchange",
            "signal": random.choice(["Hold", "Buy"]), # Arbitrage rarely shouts sell
            "confidence": random.randint(80, 99),
            "description": "Gap detection between Delta, Binance, & OKX."
        }
    ]
    
    # Calculate consensus weighting
    scores = {"Buy": 0, "Hold": 0, "Sell": 0}
    for agent in agents:
        weight = agent["confidence"] / 100
        scores[agent["signal"]] += weight
        
    final_signal = max(scores, key=scores.get)
    total_weight = sum(scores.values())
    overall_confidence = int((scores[final_signal] / total_weight) * 100) if total_weight > 0 else 0

    return {
        "asset": asset,
        "consensus": final_signal,
        "overall_confidence": overall_confidence,
        "agents": agents,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    }

@app.get("/api/portfolio")
def get_portfolio():
    # Simulate a live environment - 40% chance of a new trade executing every time this is called
    if random.random() < 0.4:
        new_id = str(uuid.uuid4())
        is_profit = random.random() > 0.35 # 65% win rate
        asset = random.choice(["BTC", "ETH", "SOL", "LINK"])
        base_price = {"BTC": 65000, "ETH": 3500, "SOL": 150, "LINK": 18}[asset]
        price = base_price * (1 + random.uniform(-0.02, 0.02))
        amount = str(round(random.uniform(0.01, 5.0), 2))
        pnl_val = random.uniform(10, 300)
        
        if is_profit:
            portfolio_state["balance"] += pnl_val
            pnl_str = f"+ ${pnl_val:.2f}"
            status = "profit"
        else:
            portfolio_state["balance"] -= pnl_val
            pnl_str = f"- ${pnl_val:.2f}"
            status = "loss"
            
        new_trade = {
            "id": new_id,
            "type": random.choice(["Buy", "Sell"]),
            "asset": asset,
            "amount": amount,
            "price": round(price, 2),
            "time": "Just now",
            "pnl": pnl_str,
            "status": status
        }
        
        # update trades history
        for trade in portfolio_state["recent_trades"]:
            if trade["time"] == "Just now": trade["time"] = "1 min ago"
            elif trade["time"] == "1 min ago": trade["time"] = "2 mins ago"
            
        portfolio_state["recent_trades"].insert(0, new_trade)
        portfolio_state["recent_trades"] = portfolio_state["recent_trades"][:8] # keep last 8
        portfolio_state["auto_trades_executed"] += 1
        
        # add some noise to profit factor
        portfolio_state["profit_factor"] = round(portfolio_state["profit_factor"] + random.uniform(-0.01, 0.02), 2)
        
    profit_pct = ((portfolio_state["balance"] - 22000) / 22000) * 100

    return {
        "balance": round(portfolio_state["balance"], 2),
        "profit_percentage": round(profit_pct, 2),
        "auto_trades_executed": portfolio_state["auto_trades_executed"],
        "profit_factor": portfolio_state["profit_factor"],
        "recent_trades": portfolio_state["recent_trades"]
    }

@app.websocket("/ws/market_updates")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive any message from the client if needed
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

async def market_data_simulator():
    """Background task to simulate pushing market data to the dashboard continually."""
    while True:
        # In a real scenario, this gets data from decision_engine / delta_api
        dummy_data = {
            "type": "MARKET_UPDATE",
            "symbol": "BTC/USDT",
            "price": 65000 + (asyncio.get_event_loop().time() % 100),
            "prediction": "Buy",
            "confidence": 0.85,
            "risk_level": "Low"
        }
        await manager.broadcast(json.dumps(dummy_data))
        
        # Simulate active bots trading
        for bot in bots_state:
            if bot["status"] == "Running":
                if random.random() < 0.2: # 20% chance to trade
                    bot["trades_executed"] += 1
                    # Simulate some random PnL shift
                    shift = random.uniform(-10, 15)
                    bot["profit_loss"] = round(bot["profit_loss"] + shift, 2)
                    
        await asyncio.sleep(2)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(market_data_simulator())
