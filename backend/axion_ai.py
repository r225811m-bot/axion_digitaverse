import random
import statistics

class AxionAI:
    def __init__(self, blockchain):
        self.blockchain = blockchain

    def chain_stats(self):
        tx_amounts = [
            b.data.get("amount", 0)
            for b in self.blockchain.chain
            if b.data.get("type") == "transaction"
        ]
        mint_amounts = [
            b.data.get("amount", 0)
            for b in self.blockchain.chain
            if b.data.get("type") == "mint"
        ]
        stats = {
            "total_transactions": len(tx_amounts),
            "total_mints": len(mint_amounts),
            "avg_tx_amount": statistics.mean(tx_amounts) if tx_amounts else 0,
            "avg_mint_amount": statistics.mean(mint_amounts) if mint_amounts else 0,
            "max_tx_amount": max(tx_amounts) if tx_amounts else 0,
            "min_tx_amount": min(tx_amounts) if tx_amounts else 0,
        }
        return stats

    def detect_anomalies(self):
        tx_amounts = [
            b.data.get("amount", 0)
            for b in self.blockchain.chain
            if b.data.get("type") == "transaction"
        ]
        if not tx_amounts:
            return []
        mean = statistics.mean(tx_amounts)
        stdev = statistics.stdev(tx_amounts) if len(tx_amounts) > 1 else 0
        anomalies = [
            amt for amt in tx_amounts if abs(amt - mean) > 2 * stdev
        ]
        return anomalies

    def optimize_chain(self):
        # Dummy optimization suggestion
        return "No optimization needed. Chain is healthy."

    def code_completion(self, prompt):
        # Dummy code completion for smart contracts
        if "transfer" in prompt.lower():
            return (
                "def transfer(sender, recipient, amount):\n"
                "    if get_balance(sender) >= amount:\n"
                "        # update balances\n"
                "        pass\n"
                "    else:\n"
                "        raise Exception('Insufficient funds')"
            )
        return "# AI code completion not available for this prompt."

    def generate_contract(self, contract_type):
        # Dummy contract generator
        if contract_type == "escrow":
            return (
                "class EscrowContract:\n"
                "    def __init__(self, payer, payee, amount):\n"
                "        self.payer = payer\n"
                "        self.payee = payee\n"
                "        self.amount = amount\n"
                "        self.released = False\n"
                "    def release(self):\n"
                "        self.released = True\n"
                "        # transfer funds\n"
            )
        return "# Unknown contract type"

    def data_science_report(self):
        stats = self.chain_stats()
        anomalies = self.detect_anomalies()
        return {
            "stats": stats,
            "anomalies": anomalies,
            "optimization": self.optimize_chain()
        }