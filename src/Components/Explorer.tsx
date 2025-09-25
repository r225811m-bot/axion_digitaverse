import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function Explorer() {
  const [chain, setChain] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChain = async () => {
      const res = await fetch("http://localhost:5000/api/chain");
      const data = await res.json();
      setChain(data);
      setLoading(false);
    };
    fetchChain();
  }, []);

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center text-white">Acoin Blockchain Explorer</h2>
      {loading ? (
        <div className="text-center">Loading chain...</div>
      ) : (
        <div className="table-responsive">
          <motion.table
            className="table table-bordered table-striped"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <thead>
              <tr>
                <th>Index</th>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Data</th>
                <th>Nonce</th>
                <th>Hash</th>
                <th>Prev Hash</th>
              </tr>
            </thead>
            <tbody>
              {chain.map((block, idx) => (
                <motion.tr
                  key={block.index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <td>{block.index}</td>
                  <td>{new Date(block.timestamp * 1000).toLocaleString()}</td>
                  <td>{block.data.type}</td>
                  <td>
                    <pre style={{ fontSize: "0.8em", whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(block.data, null, 2)}
                    </pre>
                  </td>
                  <td>{block.nonce}</td>
                  <td style={{ wordBreak: "break-all" }}>{block.hash}</td>
                  <td style={{ wordBreak: "break-all" }}>{block.previous_hash}</td>
                </motion.tr>
              ))}
            </tbody>
          </motion.table>
        </div>
      )}
    </div>
  );
}

export default Explorer;