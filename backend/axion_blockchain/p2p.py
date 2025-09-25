import requests

class PeerNetwork:
    def __init__(self):
        self.peers = set()

    def add_peer(self, peer_url):
        self.peers.add(peer_url)

    def broadcast_chain(self, chain):
        for peer in self.peers:
            try:
                requests.post(f"{peer}/api/replace-chain", json={"chain": chain})
            except Exception:
                pass

    def sync_chain(self, local_chain):
        longest = local_chain
        for peer in self.peers:
            try:
                res = requests.get(f"{peer}/api/chain")
                peer_chain = res.json()
                if len(peer_chain) > len(longest):
                    longest = peer_chain
            except Exception:
                pass
        return longest