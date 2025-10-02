
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
import random

app = Flask(__name__)
CORS(app)

# --- ECONOMIC CONSTANTS ---
GAS_FEE = 0.01
SUPERUSER_BALANCE = 1_000_000.0

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

IDE_ROOT = os.path.join(BASE_DIR, "ide_workspace")
os.makedirs(IDE_ROOT, exist_ok=True)

# --- MINER-RELATED HELPER FUNCTIONS ---

def get_miners():
    miners = set()
    for block in blockchain.chain:
        transactions = block.data if isinstance(block.data, list) else [block.data]
        for tx in transactions:
            if tx.get("type") == "register-miner":
                miners.add(tx.get("address"))
    return list(miners)

def get_random_miner():
    miners = get_miners()
    if not miners:
        return SUPERUSER_PUBLIC_KEY # Fallback to superuser if no miners are registered
    return random.choice(miners)

# --- GENESIS SETUP ---
def setup_genesis_user_and_balance():
    if len(blockchain.chain) == 1:
        user_data = {"type": "user", "username": SUPERUSER_USERNAME, "profilePic": "", "address": SUPERUSER_PUBLIC_KEY, "privateKey": SUPERUSER_PRIVATE_KEY, "gas": 0}
        blockchain.mine_block(user_data, miner_address=None)
        mint_data = {"type": "mint", "to": SUPERUSER_PUBLIC_KEY, "amount": SUPERUSER_BALANCE, "gas": 0}
        blockchain.mine_block(mint_data, miner_address=None)

setup_genesis_user_and_balance()

# --- MINER ENDPOINTS ---

@app.route("https://axion-digitaverse-3.onrender.com/api/miners", methods=["GET"])
def list_miners():
    return jsonify(get_miners())

@app.route("https://axion-digitaverse-3.onrender.com/api/register-miner", methods=["POST"])
def register_miner():
    data = request.json
    address = data.get("address")
    if not address:
        return jsonify({"error": "Address is required"}), 400

    if blockchain.get_balance(address) < GAS_FEE:
        return jsonify({"error": "Insufficient balance to register as a miner (gas fee)"}), 400

    miner_tx = {
        "type": "register-miner",
        "address": address,
        "gas": GAS_FEE
    }
    # The miner registration is mined by a random existing miner
    miner = get_random_miner()
    blockchain.mine_block(miner_tx, miner_address=miner)
    return jsonify({"message": f"Address {address} successfully registered as a miner."}), 201


# --- BLOCKCHAIN & WALLET ENDPOINTS ---

@app.route("https://axion-digitaverse-3.onrender.com/api/chain", methods=["GET"])
def get_chain():
    return jsonify(blockchain.to_dict())

@app.route("https://axion-digitaverse-3.onrender.com/api/wallet/<address>", methods=["GET"])
def get_wallet(address):
    balance = blockchain.get_balance(address)
    is_miner = address in get_miners()
    return jsonify({"address": address, "balance": balance, "is_miner": is_miner})

@app.route("https://axion-digitaverse-3.onrender.com/api/mint", methods=["POST"])
def mint():
    data = request.json
    to_address = data["to"]
    amount = float(data["amount"])
    mint_data = {"type": "mint", "to": to_address, "amount": amount, "gas": 0}
    blockchain.mine_block(mint_data, miner_address=None)
    return jsonify({"message": f"Minted {amount} to {to_address}"})

@app.route("https://axion-digitaverse-3.onrender.com/api/transaction", methods=["POST"])
def create_transaction():
    data = request.json
    sender = data["from"]
    recipient = data["to"]
    amount = float(data["amount"])
    miner = data.get("miner") or get_random_miner()

    if blockchain.get_balance(sender) < amount + GAS_FEE:
        return jsonify({"error": "Insufficient balance for transaction and gas fee"}), 400

    tx_data = {"type": "transaction", "from": sender, "to": recipient, "amount": amount, "gas": GAS_FEE}
    block = blockchain.mine_block(tx_data, miner_address=miner)
    return jsonify({"message": "Transaction successful", "block": block.to_dict()}), 201

# --- USER MANAGEMENT & PROFILE ---

@app.route("https://axion-digitaverse-3.onrender.com/api/create-user", methods=["POST"])
def create_user():
    username = request.json["username"]
    public_key, private_key = generate_key_pair(username)
    user_data = {"type": "user", "username": username, "profilePic": "", "address": public_key, "privateKey": private_key, "gas": 0}
    blockchain.mine_block(user_data, miner_address=None)
    return jsonify({"message": "User created", "publicKey": public_key, "privateKey": private_key}), 201

@app.route("https://axion-digitaverse-3.onrender.com/api/login", methods=["POST"])
def login():
    data = request.json
    public_key = data.get("publicKey", "")
    private_key = data.get("privateKey", "")

    user_info = None
    for block in reversed(blockchain.chain):
        transactions = block.data if isinstance(block.data, list) else [block.data]
        for tx in transactions:
            if tx.get("type") == "user" and tx.get("address") == public_key and tx.get("privateKey") == private_key:
                user_info = tx
                break
        if user_info:
            break
            
    if user_info:
        balance = blockchain.get_balance(public_key)
        is_miner = public_key in get_miners()
        return jsonify({
            "message": "Login successful", 
            "user": {
                "username": user_info.get("username"), 
                "address": public_key, 
                "profilePic": user_info.get("profilePic", ""), 
                "balance": balance,
                "isMiner": is_miner
            }
        }), 200

    return jsonify({"message": "Invalid credentials"}), 401
    
@app.route("https://axion-digitaverse-3.onrender.com/api/upload-profile-pic", methods=["POST"])
def upload_profile_pic():
    address = request.form["address"]
    miner = request.form.get("miner") or get_random_miner()

    if blockchain.get_balance(address) < GAS_FEE:
        return jsonify({"error": "Insufficient balance for gas fee"}), 400

    if "profilePic" not in request.files:
        return jsonify({"error": "No file"}), 400
        
    file = request.files["profilePic"]
    filename = f'{address}_{int(time.time())}_{file.filename}'
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    
    pic_update_data = {"type": "profile_update", "address": address, "profilePic": filename, "gas": GAS_FEE}
    blockchain.mine_block(pic_update_data, miner_address=miner)
    return jsonify({"message": "Profile pic updated", "profilePic": filename}), 200

@app.route("https://axion-digitaverse-3.onrender.com/api/profile-pic/<address>", methods=["GET"])
def get_profile_pic(address):
    for block in reversed(blockchain.chain):
        transactions = block.data if isinstance(block.data, list) else [block.data]
        for tx in transactions:
            if tx.get("type") in ["user", "profile_update"] and tx.get("address") == address:
                pic = tx.get("profilePic")
                if pic:
                    return send_from_directory(UPLOAD_FOLDER, pic)
    return "", 404

@app.route("https://axion-digitaverse-3.onrender.com/api/contacts/add", methods=["POST"])
def add_contact():
    data = request.json
    user_address = data.get("user_address")
    contact_address = data.get("contact_address")
    miner = data.get("miner") or get_random_miner()

    if not user_address or not contact_address:
        return jsonify({"error": "User address and contact address are required"}), 400

    if blockchain.get_balance(user_address) < GAS_FEE:
        return jsonify({"error": "Insufficient balance to add a contact (gas fee)"}), 400

    contact_data = {
        "type": "add_contact",
        "user_address": user_address,
        "contact_address": contact_address,
        "gas": GAS_FEE,
    }
    
    block = blockchain.mine_block(contact_data, miner_address=miner)
    return jsonify({"message": "Contact added successfully", "block": block.to_dict()}), 201

@app.route("https://axion-digitaverse-3.onrender.com/api/contacts/<address>", methods=["GET"])
def get_contacts(address):
    contacts = []
    for block in blockchain.chain:
        transactions = block.data if isinstance(block.data, list) else [block.data]
        for tx in transactions:
            if tx.get("type") == "add_contact" and tx.get("user_address") == address:
                contacts.append(tx.get("contact_address"))
    
    # Now, for each contact address, let's fetch the user information
    contact_details = []
    for contact_address in contacts:
        user_info = None
        for block in reversed(blockchain.chain):
            transactions = block.data if isinstance(block.data, list) else [block.data]
            for tx in transactions:
                if tx.get("type") == "user" and tx.get("address") == contact_address:
                    user_info = {
                        "username": tx.get("username"),
                        "address": tx.get("address"),
                        "profilePic": tx.get("profilePic", "")
                    }
                    break
            if user_info:
                break
        if user_info:
            contact_details.append(user_info)

    return jsonify(contact_details)

@app.route("/api/status", methods=["POST"])
def set_status():
    data = request.json
    address = data.get("address")
    status = data.get("status")
    miner = data.get("miner") or get_random_miner()

    if not address or not status:
        return jsonify({"error": "Address and status are required"}), 400

    if blockchain.get_balance(address) < GAS_FEE:
        return jsonify({"error": "Insufficient balance to set a status (gas fee)"}), 400

    status_data = {
        "type": "set_status",
        "address": address,
        "status": status,
        "gas": GAS_FEE,
    }
    
    block = blockchain.mine_block(status_data, miner_address=miner)
    return jsonify({"message": "Status set successfully", "block": block.to_dict()}), 201

@app.route("https://axion-digitaverse-3.onrender.com/api/status/<address>", methods=["GET"])
def get_status(address):
    latest_status = ""
    for block in reversed(blockchain.chain):
        transactions = block.data if isinstance(block.data, list) else [block.data]
        for tx in transactions:
            if tx.get("type") == "set_status" and tx.get("address") == address:
                latest_status = tx.get("status")
                return jsonify({"status": latest_status})
    return jsonify({"status": ""})

# --- SMART CONTRACT ENDPOINTS (AXION VM) ---

@app.route("https://axion-digitaverse-3.onrender.com/api/contract/deploy", methods=["POST"])
def deploy_contract_endpoint():
    data = request.json
    contract_code = data.get("code", "")
    constructor_args = data.get("args", [])
    deployer_address = data.get("deployer")
    miner = data.get("miner") or get_random_miner()

    if not deployer_address:
        return jsonify({"error": "Deployer address is required"}), 400

    if blockchain.get_balance(deployer_address) < GAS_FEE:
        return jsonify({"error": "Insufficient balance to deploy contract (gas fee)"}), 400

    if not contract_code:
        return jsonify({"error": "Contract code is required"}), 400
        
    address, error = axion_vm.deploy_contract(contract_code, constructor_args)
    if error:
        return jsonify({"error": f"Failed to deploy contract: {error}"}), 500
        
    deployment_data = {"type": "deploy_contract", "contract_address": address, "code": contract_code, "constructor_args": constructor_args, "gas": GAS_FEE}
    blockchain.mine_block(deployment_data, miner_address=miner)
    return jsonify({"message": "Contract deployed successfully", "contract_address": address}), 201

@app.route("https://axion-digitaverse-3.onrender.com/api/contract/call", methods=["POST"])
def call_contract_endpoint():
    data = request.json
    contract_address = data.get("address")
    method_name = data.get("method")
    method_args = data.get("args", [])
    caller_address = data.get("caller")
    miner = data.get("miner") or get_random_miner()

    if not caller_address:
        return jsonify({"error": "Caller address is required"}), 400

    if blockchain.get_balance(caller_address) < GAS_FEE:
        return jsonify({"error": "Insufficient balance for contract call (gas fee)"}), 400

    result, error = axion_vm.call_contract(contract_address, method_name, method_args)
    if error:
        return jsonify({"error": f"Failed to call contract: {error}"}), 500
        
    call_data = {"type": "call_contract", "contract_address": contract_address, "method": method_name, "args": method_args, "result": result, "gas": GAS_FEE}
    blockchain.mine_block(call_data, miner_address=miner)
    return jsonify({"message": "Contract call successful", "result": result})

@app.route("https://axion-digitaverse-3.onrender.com/api/contract/<contract_address>", methods=["GET"])
def get_contract_state_endpoint(contract_address):
    state = axion_vm.get_contract_state(contract_address)
    if state is None: return jsonify({"error": "Contract not found"}), 404
    return jsonify({"contract_address": contract_address, "state": state})

@app.route("https://axion-digitaverse-3.onrender.com/api/contracts", methods=["GET"])
def get_all_contracts():
    return jsonify([{"address": addr, "state": axion_vm.get_contract_state(addr)} for addr in axion_vm.contracts])

# --- AXION AI ENDPOINTS ---
@app.route("https://axion-digitaverse-3.onrender.com/api/axion-ai", methods=["POST"])
def axion_ai_chatbot():
    reply = axion_ai.ask(request.json.get("prompt", ""))
    return jsonify({"reply": reply})

@app.route("https://axion-digitaverse-3.onrender.com/api/axion-ai/dashboard", methods=["GET"])
def axion_ai_dashboard():
    report = axion_ai.data_science_report()
    return jsonify(report)

# --- IDE & FILE MANAGEMENT ENDPOINTS ---
@app.route("https://axion-digitaverse-3.onrender.com/api/ide/run", methods=["POST"])
def ide_run():
    rel_path = request.json.get("path", "")
    abs_path = os.path.join(IDE_ROOT, rel_path)
    if not (abs_path.startswith(IDE_ROOT) and abs_path.endswith(".py")):
        return jsonify({"error": "Invalid path"}), 400
    if not os.path.isfile(abs_path):
        return jsonify({"error": "File not found"}), 404
    exec_globals = {'blockchain': blockchain}
    old_stdout = sys.stdout
    sys.stdout = mystdout = io.StringIO()
    try:
        with open(abs_path, "r", encoding="utf-8") as f: code = f.read()
        exec(code, exec_globals)
        output = mystdout.getvalue()
    except Exception as e:
        output = str(e)
    finally:
        sys.stdout = old_stdout
    return jsonify({"output": output})

@app.route("https://axion-digitaverse-3.onrender.com/api/ide/list", methods=["GET"])
def ide_list():
    def walk_dir(path):
        items = []
        for name in os.listdir(path):
            full = os.path.join(path, name)
            if os.path.isdir(full):
                items.append({"type": "folder", "name": name, "children": walk_dir(full)})
            else:
                items.append({"type": "file", "name": name})
        return items
    return jsonify(walk_dir(IDE_ROOT))

@app.route("https://axion-digitaverse-3.onrender.com/api/ide/open", methods=["POST"])
def ide_open():
    rel_path = request.json.get("path", "")
    abs_path = os.path.join(IDE_ROOT, rel_path)
    if not abs_path.startswith(IDE_ROOT): return jsonify({"error": "Invalid path"}), 400
    if not os.path.isfile(abs_path): return jsonify({"error": "File not found"}), 404
    with open(abs_path, "r", encoding="utf-8") as f:
        return jsonify({"content": f.read()})

@app.route("https://axion-digitaverse-3.onrender.com/api/ide/save", methods=["POST"])
def ide_save():
    rel_path = request.json.get("path", "")
    content = request.json.get("content", "")
    abs_path = os.path.join(IDE_ROOT, rel_path)
    if not abs_path.startswith(IDE_ROOT): return jsonify({"error": "Invalid path"}), 400
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, "w", encoding="utf-8") as f: f.write(content)
    return jsonify({"message": "Saved"})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
