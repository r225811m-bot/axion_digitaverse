import hashlib
import time
import json
import os

DIFFICULTY = 4
GAS_PER_TX = 1
MINING_REWARD = 10
CHAIN_FILE = "blockchain.json"

class Block:
    def __init__(self, index, previous_hash, timestamp, data, nonce=0, hash=None):
        self.index = index
        self.previous_hash = previous_hash
        self.timestamp = timestamp
        self.data = data
        self.nonce = nonce
        self.hash = hash or self.calculate_hash()

    def calculate_hash(self):
        value = (
            str(self.index)
            + self.previous_hash
            + str(self.timestamp)
            + json.dumps(self.data, sort_keys=True)
            + str(self.nonce)
        )
        return hashlib.sha256(value.encode()).hexdigest()

    def to_dict(self):
        return {
            "index": self.index,
            "previous_hash": self.previous_hash,
            "timestamp": self.timestamp,
            "data": self.data,
            "nonce": self.nonce,
            "hash": self.hash,
        }

    @staticmethod
    def from_dict(d):
        return Block(
            d["index"],
            d["previous_hash"],
            d["timestamp"],
            d["data"],
            d["nonce"],
            d["hash"],
        )

class Blockchain:
    def __init__(self):
        self.chain = []
        self.load_chain()

    def create_genesis_block(self):
        genesis_block = Block(
            index=0,
            previous_hash="0",
            timestamp=time.time(),
            data={"type": "genesis"},
            nonce=0,
        )
        self.chain.append(genesis_block)
        self.save_chain()

    def get_last_block(self):
        return self.chain[-1]

    def mine_block(self, data, miner_address=None):
        last_block = self.get_last_block()
        index = last_block.index + 1
        previous_hash = last_block.hash
        timestamp = time.time()
        nonce = 0
        while True:
            block = Block(index, previous_hash, timestamp, data, nonce)
            if block.hash.startswith("0" * DIFFICULTY):
                break
            nonce += 1
        self.chain.append(block)
        self.save_chain()
        # Reward the miner (except for mint and reward blocks)
        if miner_address and data.get("type") not in ["mint", "reward"]:
            reward_data = {
                "type": "reward",
                "to": miner_address,
                "amount": MINING_REWARD
            }
            self.mine_block(reward_data)
        return block

    def add_block(self, block):
        if self.is_valid_new_block(block, self.get_last_block()):
            self.chain.append(block)
            self.save_chain()
            return True
        return False

    def is_valid_new_block(self, new_block, previous_block):
        if previous_block.index + 1 != new_block.index:
            return False
        if previous_block.hash != new_block.previous_hash:
            return False
        if new_block.hash != new_block.calculate_hash():
            return False
        if not new_block.hash.startswith("0" * DIFFICULTY):
            return False
        return True

    def is_chain_valid(self):
        for i in range(1, len(self.chain)):
            if not self.is_valid_new_block(self.chain[i], self.chain[i - 1]):
                return False
        return True

    def get_balance(self, address):
        balance = 0
        for block in self.chain:
            d = block.data
            if d.get("type") == "mint" and d.get("to") == address:
                balance += d.get("amount", 0)
            if d.get("type") == "reward" and d.get("to") == address:
                balance += d.get("amount", 0)
            if d.get("type") == "transaction":
                if d.get("from") == address:
                    balance -= d.get("amount", 0) + d.get("gas", 0)
                if d.get("to") == address:
                    balance += d.get("amount", 0)
            if d.get("type") == "loan_funding":
                if d.get("lender") == address:
                    balance -= d.get("amount", 0)
            if d.get("type") == "loan_repayment":
                if d.get("borrower") == address:
                    balance -= d.get("amount", 0)
                if d.get("lender") == address:
                    balance += d.get("amount", 0)
        return balance

    def save_chain(self):
        with open(CHAIN_FILE, "w", encoding="utf-8") as f:
            json.dump([b.to_dict() for b in self.chain], f, indent=2)

    def load_chain(self):
        if os.path.exists(CHAIN_FILE):
            with open(CHAIN_FILE, "r", encoding="utf-8") as f:
                blocks = json.load(f)
                self.chain = [Block.from_dict(b) for b in blocks]
        if not self.chain:
            self.create_genesis_block()

    def to_dict(self):
        return [block.to_dict() for block in self.chain]

def generate_key_pair(username):
    salt = os.urandom(16).hex()
    private_key = hashlib.sha256((username + salt).encode()).hexdigest()
    public_key = hashlib.sha256(private_key.encode()).hexdigest()
    return public_key, private_key