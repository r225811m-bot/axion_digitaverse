from flask import Flask, request, jsonify, abort
from axion_blockchain import Blockchain, generate_key_pair
from p2p import PeerNetwork
import sys
import threading

app = Flask(__name__)
blockchain = Blockchain()
peers = PeerNetwork()
users = {}  # {address: private_key}

@app.route("/api/create-user", methods=["POST"])
def create_user():
    data = request.json
    username = data["username"]
    public_key, private_key = generate_key_pair(username)
    blockchain.add_user(public_key)
    blockchain.mine_block({"type": "user", "username": username, "address": public_key}, miner_address=public_key)
    users[public_key] = private_key
    return jsonify({"publicKey": public_key, "privateKey": private_key})

def authenticate():
    address = request.headers.get("X-Address")
    token = request.headers.get("X-Token")
    if not address or not token or users.get(address) != token:
        abort(401, "Unauthorized")

@app.route("/api/wallet/<address>", methods=["GET"])
def get_wallet(address):
    authenticate()
    return jsonify({"address": address, "balance": blockchain.get_balance(address)})

@app.route("/api/transaction", methods=["POST"])
def transaction():
    authenticate()
    data = request.json
    tx = blockchain.create_transaction(data["from"], data["to"], int(data["amount"]))
    block = blockchain.mine_block(tx, miner_address=data["from"])
    peers.broadcast_chain(blockchain.to_dict())
    return jsonify({"block": block.to_dict()})

@app.route("/api/agent-deposit", methods=["POST"])
def agent_deposit():
    authenticate()
    data = request.json
    deposit_data = {
        "type": "agent_deposit",
        "from": data["agent_address"],
        "to": data["user_address"],
        "amount": int(data["amount"])
    }
    block = blockchain.mine_block(deposit_data, miner_address=data["agent_address"])
    peers.broadcast_chain(blockchain.to_dict())
    return jsonify({"block": block.to_dict()})

@app.route("/api/python-exec", methods=["POST"])
def python_exec():
    authenticate()
    import sys, io
    data = request.json
    code = data["code"]
    address = request.headers.get("X-Address")
    old_stdout = sys.stdout
    sys.stdout = mystdout = io.StringIO()
    try:
        exec(code, {})
        output = mystdout.getvalue()
    except Exception as e:
        output = str(e)
    finally:
        sys.stdout = old_stdout
    exec_data = {"type": "python_exec", "code": code, "output": output}
    block = blockchain.mine_block(exec_data, miner_address=address)
    peers.broadcast_chain(blockchain.to_dict())
    return jsonify({"output": output, "block": block.to_dict()})

@app.route("/api/chain", methods=["GET"])
def get_chain():
    return jsonify(blockchain.to_dict())

@app.route("/api/replace-chain", methods=["POST"])
def replace_chain():
    data = request.json
    blockchain.replace_chain(data["chain"])
    return jsonify({"message": "Chain replaced"})

@app.route("/api/add-peer", methods=["POST"])
def add_peer():
    data = request.json
    peers.add_peer(data["peer_url"])
    return jsonify({"message": "Peer added"})

def sync_with_peers():
    import time
    while True:
        new_chain = peers.sync_chain(blockchain.to_dict())
        blockchain.replace_chain(new_chain)
        time.sleep(10)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = 5000
    if len(sys.argv) > 2:
        for peer_url in sys.argv[2:]:
            peers.add_peer(peer_url)
    threading.Thread(target=sync_with_peers, daemon=True).start()
    app.run(port=port)