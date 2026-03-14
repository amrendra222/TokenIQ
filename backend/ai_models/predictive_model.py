import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import ta

class PredictiveModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.is_trained = False

    def add_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculates technical indicators using the ta library."""
        df = df.copy()
        
        # RSI
        df['rsi'] = ta.momentum.RSIIndicator(close=df['close'], window=14).rsi()
        
        # MACD
        macd = ta.trend.MACD(close=df['close'])
        df['macd'] = macd.macd()
        df['macd_signal'] = macd.macd_signal()
        
        # Bollinger Bands
        bb = ta.volatility.BollingerBands(close=df['close'], window=20, window_dev=2)
        df['bb_high'] = bb.bollinger_hband()
        df['bb_low'] = bb.bollinger_lband()
        
        # Moving Averages
        df['sma_20'] = ta.trend.SMAIndicator(close=df['close'], window=20).sma_indicator()
        df['sma_50'] = ta.trend.SMAIndicator(close=df['close'], window=50).sma_indicator()
        
        df.dropna(inplace=True)
        return df

    def prepare_data(self, df: pd.DataFrame):
        """Prepares features and target for the model."""
        df = self.add_indicators(df)
        
        # Target: 1 if next close > current close (Buy), 0 if lower (Sell), Hold logic can be complex
        df['target'] = np.where(df['close'].shift(-1) > df['close'], 1, 0)
        
        # Features
        features = ['rsi', 'macd', 'macd_signal', 'bb_high', 'bb_low', 'sma_20', 'sma_50', 'volume']
        X = df[features]
        y = df['target']
        
        return X, y

    def train(self, historical_data: pd.DataFrame):
        """Trains the Random Forest model."""
        if historical_data.empty or len(historical_data) < 100:
            print("Not enough data to train model.")
            return

        X, y = self.prepare_data(historical_data)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        print(f"Model trained. Accuracy on test data: {self.model.score(X_test, y_test):.2f}")

    def predict(self, current_data: pd.DataFrame) -> dict:
        """
        Predicts whether to Buy, Sell, or Hold based on recent data.
        Returns prediction ("Buy", "Sell", "Hold") and confidence score.
        """
        if not self.is_trained:
            return {"prediction": "Hold", "confidence": 0.0}

        df_features = self.add_indicators(current_data)
        if df_features.empty:
            return {"prediction": "Hold", "confidence": 0.0}

        latest_features = df_features.iloc[[-1]][['rsi', 'macd', 'macd_signal', 'bb_high', 'bb_low', 'sma_20', 'sma_50', 'volume']]
        
        proba = self.model.predict_proba(latest_features)[0]
        buy_prob = proba[1]
        sell_prob = proba[0]
        
        confidence = max(buy_prob, sell_prob)
        
        if confidence < 0.6:
             prediction = "Hold"
        elif buy_prob > sell_prob:
             prediction = "Buy"
        else:
             prediction = "Sell"
             
        return {"prediction": prediction, "confidence": round(confidence, 2)}
