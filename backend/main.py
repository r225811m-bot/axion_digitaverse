from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from axion_chain import Blockchain, generate_key_pair
from axion_ai import AxionAI
from axion_vm import AxionVM
import os
import time
import sys
import io
import shutil

app = Flask(__name__)
CORS(app)

# --- INITIALIZE CORE COMPONENTS ---
blockchain = Blockchain()
axion_ai = AxionAI(blockchain)
axion_vm = AxionVM(blockchain)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

SUPERUSER_PUBLIC_KEY = "a3a2afda3a17cc26ec134f7f1d09fe5c1615f0ba1ef2a2e4fe754e1987910b05"
SUPERUSER_PRIVATE_KEY = "3547423487c782ecb41223126b302ea8c0af5bcb7beaf58dc8882697094598f3"
SUPERUSER_USERNAME = "zimtechguru"
SUPERUSER_BALANCE = 1_000_000

IDE_ROOT = os.path.join(BASE_DIR, "ide_workspace")
os.makedirs(IDE_ROOT, exist_ok=True)

def ensure_superuser():
    # Check if superuser user block exists
    has_user = any(
        b.data.get("type") == "user" and b.data.get("address") == SUPERUSER_PUBLIC_KEY
        for b in blockchain.chain
    )
    if not has_user:
        user_data = {
            "type": "user",
            "username": SUPERUSER_USERNAME,
            "profilePic": "",
            "address": SUPERUSER_PUBLIC_KEY,
            "privateKey": SUPERUSER_PRIVATE_KEY
        }
        blockchain.mine_block(user_data, miner_address=SUPERUSER_PUBLIC_KEY)
    # Check if superuser mint block exists
    has_mint = any(
        b.data.get("type") == "mint" and b.data.get("to") == SUPERUSER_PUBLIC_KEY
        for b in blockchain.chain
    )
    if not has_mint:
        mint_data = {
            "type": "mint",
            "to": SUPERUSER_PUBLIC_KEY,
            "amount": SUPERUSER_BALANCE
        }
        blockchain.mine_block(mint_data, miner_address=SUPERUSER_PUBLIC_KEY)

ensure_superuser()

# --- BLOCKCHAIN & WALLET ENDPOINTS ---

@app.route("/api/chain", methods=["GET"])
def get_chain():
    return jsonify(blockchain.to_dict())

@app.route("/api/wallet/<address>", methods=["GET"])
def get_wallet(address):
    balance = blockchain.get_balance(address)
    return jsonify({"address": address, "balance": balance})

@app.route("/api/mint", methods=["POST"])
def mint():
    data = request.json
    to_address = data["to"]
    amount = int(data["amount"])
    mint_data = {"type": "mint", "to": to_address, "amount": amount}
    block = blockchain.mine_block(mint_data)
    return jsonify({"message": f"Minted {amount} to {to_address}", "block": block.to_dict()})

@app.route("/api/transaction", methods=["POST"])
def create_transaction():
    data = request.json
    sender = data["from"]
    recipient = data["to"]
    amount = int(data["amount"])
    miner = data.get("miner", sender)
    gas = 1

    if sender != SUPERUSER_PUBLIC_KEY and blockchain.get_balance(sender) < amount + gas:
        return jsonify({"error": "Insufficient balance"}), 400

    tx_data = {"type": "transaction", "from": sender, "to": recipient, "amount": amount, "gas": gas}
    block = blockchain.mine_block(tx_data, miner_address=miner)
    return jsonify({"message": "Transaction successful", "block": block.to_dict()}), 201

# --- USER MANAGEMENT ENDPOINTS ---

@app.route("/api/create-user", methods=["POST"])
def create_user():
    username = request.json["username"]
    public_key, private_key = generate_key_pair(username)
    user_data = {
        "type": "user", "username": username, "profilePic": "", 
        "address": public_key, "privateKey": private_key
    }
    blockchain.mine_block(user_data, miner_address=public_key)
    return jsonify({"message": "User created", "publicKey": public_key, "privateKey": private_key}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    public_key = data.get("publicKey", "")
    private_key = data.get("privateKey", "")

    if public_key == SUPERUSER_PUBLIC_KEY and private_key == SUPERUSER_PRIVATE_KEY:
        balance = blockchain.get_balance(SUPERUSER_PUBLIC_KEY)
        return jsonify({"message": "Login successful", "user": {"username": SUPERUSER_USERNAME, "address": SUPERUSER_PUBLIC_KEY, "profilePic": "", "balance": balance}}), 200

    for block in reversed(blockchain.chain):
        d = block.data
        if d.get("type") == "user" and d.get("address") == public_key and d.get("privateKey") == private_key:
            balance = blockchain.get_balance(public_key)
            return jsonify({"message": "Login successful", "user": {"username": d.get("username"), "address": public_key, "profilePic": d.get("profilePic", ""), "balance": balance}}), 200
    return jsonify({"message": "Invalid credentials"}), 401

# --- SMART CONTRACT ENDPOINTS (AXION VM) ---

@app.route("/api/contract/deploy", methods=["POST"])
def deploy_contract_endpoint():
    data = request.json
    contract_code = data.get("code", "")
    constructor_args = data.get("args", [])
    miner_address = data.get("miner", SUPERUSER_PUBLIC_KEY)

    if not contract_code:
        return jsonify({"error": "Contract code is required"}), 400

    address, error = axion_vm.deploy_contract(contract_code, constructor_args)
    if error:
        return jsonify({"error": f"Failed to deploy contract: {error}"}), 500

    deployment_data = {
        "type": "deploy_contract",
        "contract_address": address,
        "code": contract_code,
        "constructor_args": constructor_args
    }
    blockchain.mine_block(deployment_data, miner_address=miner_address)
    return jsonify({"message": "Contract deployed successfully", "contract_address": address}), 201

@app.route("/api/contract/call", methods=["POST"])
def call_contract_endpoint():
    data = request.json
    contract_address = data.get("address")
    method_name = data.get("method")
    method_args = data.get("args", [])
    caller_address = data.get("caller", SUPERUSER_PUBLIC_KEY)

    result, error = axion_vm.call_contract(contract_address, method_name, method_args)
    if error:
        return jsonify({"error": f"Failed to call contract: {error}"}), 500

    call_data = {
        "type": "call_contract",
        "contract_address": contract_address,
        "method": method_name,
        "args": method_args,
        "result": result
    }
    blockchain.mine_block(call_data, miner_address=caller_address)
    return jsonify({"message": "Contract call successful", "result": result})

@app.route("/api/contract/<contract_address>", methods=["GET"])
def get_contract_state_endpoint(contract_address):
    state = axion_vm.get_contract_state(contract_address)
    if state is None:
        return jsonify({"error": "Contract not found"}), 404
    return jsonify({"contract_address": contract_address, "state": state})

@app.route("/api/contracts", methods=["GET"])
def get_all_contracts():
    return jsonify([{"address": addr, "state": axion_vm.get_contract_state(addr)} for addr in axion_vm.contracts])


# --- AXION AI ENDPOINTS ---

@app.route("/api/axion-ai", methods=["POST"])
def axion_ai_chatbot():
    prompt = request.json.get("prompt", "")
    reply = axion_ai.ask(prompt)
    return jsonify({"reply": reply})

@app.route("/api/axion-ai/dashboard", methods=["GET"])
def axion_ai_dashboard():
    report = axion_ai.data_science_report()
    return jsonify(report)

@app.route("/api/axion-ai/code-completion", methods=["POST"])
def axion_ai_code_completion():
    prompt = request.json.get("prompt", "")
    completion = axion_ai.code_completion(prompt)
    return jsonify({"completion": completion})

@app.route("/api/axion-ai/generate-contract", methods=["POST"])
def axion_ai_generate_contract():
    contract_type = request.json.get("type", "")
    contract = axion_ai.generate_contract(contract_type)
    return jsonify({"contract": contract})

# --- IDE & FILE ENDPOINTS (Unchanged) ---

if __name__ == "__main__":
    app.run(debug=True, port=5001)
