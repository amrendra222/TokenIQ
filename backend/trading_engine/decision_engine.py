from ai_models.predictive_model import PredictiveModel
from trading_engine.strategy_parser import StrategyParser
from trading_engine.risk_manager import RiskManager
from delta_api import DeltaClient

class DecisionEngine:
    def __init__(self):
        self.ai = PredictiveModel()
        self.strategy = StrategyParser()
        self.risk = RiskManager()
        self.delta = DeltaClient()

    def evaluate_trade(self, symbol: str, user_strategy_prompt: str):
        """
        Coordinates the multi-agent system to make a final trading decision.
        Agent 1: AI Model (Buy, Sell, Hold)
        Agent 2: Custom Strategy
        Agent 3: Risk Management constraints
        """
        # Fetch Data
        historical_data = self.delta.fetch_market_data(symbol, limit=100)
        if historical_data.empty:
            return {"status": "error", "message": "Failed to fetch market data"}

        current_price = historical_data.iloc[-1]['close']
        account_info = self.delta.get_account_balance()
        balance = account_info.get('USDT', {}).get('free', 1000.0) # dummy fallback

        # Agent 1: Predictive Model
        if not self.ai.is_trained:
            self.ai.train(historical_data)
            
        ai_signal = self.ai.predict(historical_data)
        
        # Agent 2: Strategy Parser
        strategy_json = self.strategy.parse_natural_language_strategy(user_strategy_prompt)
        # Note: robust implementation would parse `RSI < 30` dynamically using eval() or abstract syntax tree 
        # on the current_data indicators. For simulation, assume the strategy aligns if AI says Buy.
        strategy_signal = ai_signal['prediction'] # Simulator override for now
        
        # Agent 3: Risk Manager
        # Mock volatility metric based on recent bollinger band width or standard deviation
        volatility = "Medium" 
        risk_metrics = self.risk.assess_risk(account_balance=balance, current_price=current_price, volatility=volatility)

        # Decision Logic: All agents must agree
        final_decision = "Hold"
        if ai_signal['prediction'] == "Buy" and strategy_signal == "Buy":
            if risk_metrics['risk_level'] in ["Low", "Medium"]:
                final_decision = "Execute Buy"

        elif ai_signal['prediction'] == "Sell" and strategy_signal == "Sell":
             final_decision = "Execute Sell"

        return {
            "status": "success",
            "symbol": symbol,
            "current_price": current_price,
            "decision": final_decision,
            "ai_signal": ai_signal,
            "strategy": strategy_json,
            "risk_metrics": risk_metrics
        }
