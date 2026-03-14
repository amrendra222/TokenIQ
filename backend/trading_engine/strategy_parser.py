import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Try to load from frontend/.env.local
env_path = os.path.join(os.path.dirname(__file__), '../../../frontend/.env.local')
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class StrategyParser:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if self.api_key:
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.api_key,
            )
        else:
            self.client = None

    def parse_natural_language_strategy(self, prompt: str) -> dict:
        """
        Uses an LLM to convert a natural language trading strategy into a structured JSON condition.
        Returns a dictionary with parsed buy_condition and sell_condition.
        """
        if not self.client:
            print("OpenRouter API key not set. Returning default generic strategy.")
            return {
                "buy_condition": "RSI < 30",
                "sell_condition": "RSI > 70"
            }

        sys_prompt = (
            "You are a sophisticated algorithmic trading strategy parser. "
            "Convert the following natural language trading instruction into a structured JSON dictionary "
            "with two keys: 'buy_condition' and 'sell_condition'. Ensure the logic uses common indicators like "
            "RSI, MACD, MA, or Price %. Just return the raw JSON."
            "Example Output:\n"
            "{\n  \"buy_condition\": \"RSI < 30\",\n  \"sell_condition\": \"RSI > 70\"\n}"
        )

        try:
            response = self.client.chat.completions.create(
                model="meta-llama/llama-3.1-8b-instruct",
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0
            )

            # Extract json strings
            raw_text = response.choices[0].message.content
            # Remove any markdown formatting if present
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
            
            structured_strategy = json.loads(raw_text)
            return structured_strategy

        except Exception as e:
            print(f"Error parsing strategy: {e}")
            return {
                "error": str(e),
                "buy_condition": "RSI < 30",
                "sell_condition": "RSI > 70"
            }

if __name__ == "__main__":
    parser = StrategyParser()
    result = parser.parse_natural_language_strategy("Buy BTC when RSI is below 25 and sell when it crosses over 60.")
    print("Parsed Strategy:", result)
