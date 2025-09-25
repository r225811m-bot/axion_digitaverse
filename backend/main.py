from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from axion_chain import Blockchain, generate_key_pair
from axion_ai import AxionAI
import os
import time
import sys
import io
import shutil

app = Flask(__name__)
CORS(app)
blockchain = Blockchain()
axion_ai = AxionAI(blockchain)

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
    # Optionally, add admin authentication here!
    mint_data = {
        "type": "mint",
        "to": to_address,
        "amount": amount
    }
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

    # Allow superuser to always send (bypass balance check)
    if sender != SUPERUSER_PUBLIC_KEY and blockchain.get_balance(sender) < amount + gas:
        return jsonify({"error": "Insufficient balance"}), 400

    tx_data = {
        "type": "transaction",
        "from": sender,
        "to": recipient,
        "amount": amount,
        "gas": gas
    }
    block = blockchain.mine_block(tx_data, miner_address=miner)
    return jsonify({"message": "Transaction successful", "block": block.to_dict()}), 201

@app.route("/api/create-user", methods=["POST"])
def create_user():
    username = request.json["username"]
    public_key, private_key = generate_key_pair(username)
    user_data = {
        "type": "user",
        "username": username,
        "profilePic": "",
        "address": public_key,
        "privateKey": private_key
    }
    block = blockchain.mine_block(user_data, miner_address=public_key)
    return jsonify({
        "message": "User created",
        "block": user_data,
        "publicKey": public_key,
        "privateKey": private_key
    }), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    public_key = data.get("publicKey", "")
    private_key = data.get("privateKey", "")
    # Superuser login
    if public_key == SUPERUSER_PUBLIC_KEY and private_key == SUPERUSER_PRIVATE_KEY:
        balance = blockchain.get_balance(SUPERUSER_PUBLIC_KEY)
        return jsonify({
            "message": "Login successful",
            "user": {
                "username": SUPERUSER_USERNAME,
                "address": SUPERUSER_PUBLIC_KEY,
                "profilePic": "",
                "balance": balance
            }
        }), 200
    # Normal user login
    for block in reversed(blockchain.chain):
        d = block.data
        if d.get("type") == "user" and d.get("address") == public_key and d.get("privateKey") == private_key:
            balance = blockchain.get_balance(public_key)
            return jsonify({
                "message": "Login successful",
                "user": {
                    "username": d.get("username"),
                    "address": public_key,
                    "profilePic": d.get("profilePic", ""),
                    "balance": balance
                }
            }), 200
    return jsonify({"message": "Invalid credentials"}), 401

@app.route("/api/upload-profile-pic", methods=["POST"])
def upload_profile_pic():
    address = request.form["address"]
    if "profilePic" not in request.files:
        return jsonify({"error": "No file"}), 400
    file = request.files["profilePic"]
    filename = f"{address}_{int(time.time())}_{file.filename}"
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    # Update user block (add a new block with updated profilePic)
    for block in reversed(blockchain.chain):
        d = block.data
        if d.get("type") == "user" and d.get("address") == address:
            new_data = d.copy()
            new_data["profilePic"] = filename
            blockchain.mine_block(new_data, miner_address=address)
            return jsonify({"message": "Profile pic updated", "profilePic": filename}), 200
    return jsonify({"error": "User not found"}), 404

@app.route("/api/profile-pic/<address>", methods=["GET"])
def get_profile_pic(address):
    # Find latest user block for this address
    for block in reversed(blockchain.chain):
        d = block.data
        if d.get("type") == "user" and d.get("address") == address:
            pic = d.get("profilePic", "")
            if pic:
                return send_from_directory(UPLOAD_FOLDER, pic)
    return "", 404

@app.route("/api/run-python", methods=["POST"])
def run_python():
    data = request.json
    code = data.get("code", "")
    old_stdout = sys.stdout
    sys.stdout = mystdout = io.StringIO()
    try:
        exec(code, {})
        output = mystdout.getvalue()
    except Exception as e:
        output = str(e)
    finally:
        sys.stdout = old_stdout
    return jsonify({"output": output})

@app.route("/api/python-exec", methods=["POST"])
def python_exec():
    return run_python()

@app.route("/api/ide/list", methods=["GET"])
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

@app.route("/api/ide/open", methods=["POST"])
def ide_open():
    rel_path = request.json.get("path", "")
    abs_path = os.path.join(IDE_ROOT, rel_path)
    if not abs_path.startswith(IDE_ROOT):
        return jsonify({"error": "Invalid path"}), 400
    if not os.path.isfile(abs_path):
        return jsonify({"error": "File not found"}), 404
    with open(abs_path, "r", encoding="utf-8") as f:
        return jsonify({"content": f.read()})

@app.route("/api/ide/save", methods=["POST"])
def ide_save():
    rel_path = request.json.get("path", "")
    content = request.json.get("content", "")
    abs_path = os.path.join(IDE_ROOT, rel_path)
    if not abs_path.startswith(IDE_ROOT):
        return jsonify({"error": "Invalid path"}), 400
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with open(abs_path, "w", encoding="utf-8") as f:
        f.write(content)
    return jsonify({"message": "Saved"})

@app.route("/api/ide/create", methods=["POST"])
def ide_create():
    rel_path = request.json.get("path", "")
    is_folder = request.json.get("isFolder", False)
    abs_path = os.path.join(IDE_ROOT, rel_path)
    if not abs_path.startswith(IDE_ROOT):
        return jsonify({"error": "Invalid path"}), 400
    if is_folder:
        os.makedirs(abs_path, exist_ok=True)
    else:
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "w", encoding="utf-8") as f:
            f.write("")
    return jsonify({"message": "Created"})

@app.route("/api/ide/delete", methods=["POST"])
def ide_delete():
    rel_path = request.json.get("path", "")
    abs_path = os.path.join(IDE_ROOT, rel_path)
    if not abs_path.startswith(IDE_ROOT):
        return jsonify({"error": "Invalid path"}), 400
    if os.path.isdir(abs_path):
        shutil.rmtree(abs_path)
    elif os.path.isfile(abs_path):
        os.remove(abs_path)
    else:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": "Deleted"})

@app.route("/api/ide/run", methods=["POST"])
def ide_run():
    rel_path = request.json.get("path", "")
    abs_path = os.path.join(IDE_ROOT, rel_path)
    if not abs_path.startswith(IDE_ROOT) or not abs_path.endswith(".py"):
        return jsonify({"error": "Invalid path"}), 400
    if not os.path.isfile(abs_path):
        return jsonify({"error": "File not found"}), 404
    old_stdout = sys.stdout
    sys.stdout = mystdout = io.StringIO()
    try:
        with open(abs_path, "r", encoding="utf-8") as f:
            code = f.read()
        exec(code, {})
        output = mystdout.getvalue()
    except Exception as e:
        output = str(e)
    finally:
        sys.stdout = old_stdout
    return jsonify({"output": output})

@app.route("/api/ide/test", methods=["POST"])
def ide_test():
    import subprocess
    try:
        result = subprocess.run(
            ["pytest", IDE_ROOT, "--maxfail=1", "--disable-warnings", "-q"],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=10
        )
        return jsonify({"output": result.stdout})
    except Exception as e:
        return jsonify({"output": str(e)})

@app.route("/api/ide/plugins", methods=["GET", "POST"])
def ide_plugins():
    if request.method == "GET":
        return jsonify([
            {"name": "Black Formatter", "type": "formatter"},
            {"name": "PyLint", "type": "linter"},
            {"name": "Autopep8", "type": "formatter"},
        ])
    plugin = request.json.get("plugin", "")
    return jsonify({"message": f"Plugin {plugin} installed (demo)"})

@app.route("/api/axion-ai", methods=["POST"])
def axion_ai_chatbot():
    prompt = request.json.get("prompt", "").lower()
    if "smart contract" in prompt:
        reply = "A smart contract is a self-executing contract with the terms directly written into code."
    elif "deploy" in prompt:
        reply = "To deploy a contract, write your Python code, test it, and use the Deploy button in the IDE."
    elif "acoin" in prompt:
        reply = "Acoin is the native currency of the Axion Digitaverse blockchain."
    elif "hello" in prompt or "hi" in prompt:
        reply = "Hello! I'm Axion AI, your blockchain assistant. How can I help you?"
    else:
        reply = "I'm Axion AI. Ask me about blockchain, smart contracts, or using this platform!"
    return jsonify({"reply": reply})

@app.route("/api/axion-ai/dashboard", methods=["GET"])
def axion_ai_dashboard():
    return jsonify(axion_ai.data_science_report())

@app.route("/api/axion-ai/code-completion", methods=["POST"])
def axion_ai_code_completion():
    prompt = request.json.get("prompt", "")
    code = axion_ai.code_completion(prompt)
    return jsonify({"completion": code})

@app.route("/api/axion-ai/generate-contract", methods=["POST"])
def axion_ai_generate_contract():
    contract_type = request.json.get("type", "")
    code = axion_ai.generate_contract(contract_type)
    return jsonify({"contract": code})

if __name__ == "__main__":
    app.run(debug=True)