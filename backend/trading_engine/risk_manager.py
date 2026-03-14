class RiskManager:
    def __init__(self, max_risk_per_trade=0.02, default_sl_pct=0.05, default_tp_pct=0.10):
        """
        max_risk_per_trade: Percentage of total balance allowed to risk per trade (e.g. 0.02 = 2%)
        default_sl_pct: Default stop loss percentage (e.g. 0.05 = 5%)
        default_tp_pct: Default take profit percentage
        """
        self.max_risk_per_trade = max_risk_per_trade
        self.default_sl_pct = default_sl_pct
        self.default_tp_pct = default_tp_pct

    def assess_risk(self, account_balance: float, current_price: float, volatility: str = "Medium") -> dict:
        """
        Calculates position size and risk metrics based on current market conditions and balance.
        """
        if account_balance <= 0 or current_price <= 0:
            return {
                "risk_level": "Extremely High (Invalid Balance)",
                "position_size": 0,
                "stop_loss": 0,
                "take_profit": 0
            }

        # Adjust risk limits based on market volatility
        risk_modifier = 1.0
        if volatility == "High":
             risk_modifier = 0.5  # Risk half as much in high volatility
        elif volatility == "Low":
             risk_modifier = 1.5  # Allowed to risk slightly more in low volatility

        # Calculate position size:
        # E.g. $1000 balance * 2% risk = $20 to risk. 
        # If SL is 5%, position size that risks $20 is $20 / 0.05 = $400 position.
        
        capital_at_risk = account_balance * (self.max_risk_per_trade * risk_modifier)
        sl_pct = self.default_sl_pct
        
        position_size_usd = capital_at_risk / sl_pct
        position_size_asset = position_size_usd / current_price

        # Ensure we don't try to trade more money than we have (if leverage not permitted)
        if position_size_usd > account_balance:
            position_size_usd = account_balance
            position_size_asset = position_size_usd / current_price

        # Categorize risk level
        if risk_modifier < 1.0:
            risk_level = "High"
        elif risk_modifier > 1.0:
            risk_level = "Low"
        else:
            risk_level = "Medium"

        return {
            "risk_level": risk_level,
            "capital_at_risk": round(capital_at_risk, 2),
            "position_size_usd": round(position_size_usd, 2),
            "position_size_asset": round(position_size_asset, 4),
            "stop_loss_price": round(current_price * (1 - sl_pct), 2),
            "take_profit_price": round(current_price * (1 + self.default_tp_pct), 2)
        }
