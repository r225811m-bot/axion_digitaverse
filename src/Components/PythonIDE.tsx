import { useEffect, useState } from "react";
import { useUser } from "../UserContext";
import { FaPlay, FaSave, FaFolder, FaFile, FaTrash, FaPlus, FaCloudUploadAlt, FaPhoneAlt, FaServer } from "react-icons/fa";

type FileTreeItem = {
  type: "file" | "folder";
  name: string;
  children?: FileTreeItem[];
};

type FileTreeProps = {
  tree: FileTreeItem[];
  onSelect: (path: string) => void;
  selected: string;
  prefix?: string;
};

function FileTree({ tree, onSelect, selected, prefix = "" }: FileTreeProps) {
  return (
    <ul className="list-unstyled ps-3">
      {tree.map((item) =>
        item.type === "folder" ? (
          <li key={prefix + item.name}>
            <span className="fw-bold"><FaFolder className="me-2" />{item.name}</span>
            <FileTree tree={item.children || []} onSelect={onSelect} selected={selected} prefix={prefix + item.name + "/"} />
          </li>
        ) : (
          <li key={prefix + item.name}>
            <button
              className={`btn btn-link text-decoration-none ${selected === prefix + item.name ? "bg-light" : ""}`}
              onClick={() => onSelect(prefix + item.name)}
            >
              <FaFile className="me-2" />{item.name}
            </button>
          </li>
        )
      )}
    </ul>
  );
}

function PythonIDE() {
  const { user } = useUser();
  const [tree, setTree] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [newPath, setNewPath] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState("files");

  // Smart Contract State
  const [miners, setMiners] = useState<string[]>([]);
  const [selectedMiner, setSelectedMiner] = useState("");
  const [constructorArgs, setConstructorArgs] = useState("[]");
  const [deployStatus, setDeployStatus] = useState("");
  const [callAddress, setCallAddress] = useState("");
  const [callMethod, setCallMethod] = useState("");
  const [callArgs, setCallArgs] = useState("[]");
  const [callStatus, setCallStatus] = useState("");

  // Fetch file tree
  useEffect(() => {
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/list")
      .then(res => res.json())
      .then(setTree);
  }, [refresh]);

  // Fetch miners
  useEffect(() => {
    fetch("https://axion-digitaverse-3.onrender.com/api/miners")
      .then(res => res.json())
      .then(data => {
        setMiners(data);
        if (data.length > 0) setSelectedMiner(data[0]);
      });
  }, []);

  // Load file content
  useEffect(() => {
    if (selected) {
      fetch("https://axion-digitaverse-3.onrender.com/api/ide/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selected }),
      })
        .then(res => res.json())
        .then(data => setContent(data.content || ""));
    } else {
      setContent("");
    }
  }, [selected]);

  const handleSave = () => {
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: selected, content }) })
      .then(() => setOutput(`File ${selected} saved.`));
  };

  const handleRun = () => {
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: selected }) })
      .then(res => res.json())
      .then(data => setOutput(data.output || ""));
  };

  const handleCreate = (isFolder: boolean) => {
    if (!newPath) return;
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: newPath, isFolder }) })
      .then(() => { setNewPath(""); setRefresh(r => r + 1); });
  };

  const handleDelete = () => {
    if (!selected) return;
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: selected }) })
      .then(() => { setSelected(""); setRefresh(r => r + 1); });
  };

  const handleDeploy = async () => {
    if (!user) { setDeployStatus("You must be logged in to deploy a contract."); return; }
    if (!selected.endsWith(".py")) { setDeployStatus("Please select a Python file to deploy as a contract."); return; }
    setDeployStatus("Deploying...");
    try {
      const args = JSON.parse(constructorArgs);
      const res = await fetch("https://axion-digitaverse-3.onrender.com/api/contract/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: content, args, deployer: user.address, miner: selectedMiner }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeployStatus(`Contract deployed successfully! Address: ${data.contract_address}`);
        setCallAddress(data.contract_address);
      } else {
        setDeployStatus(`Error: ${data.error}`);
      }
    } catch (e) {
      setDeployStatus("Invalid constructor arguments. Please provide a valid JSON array.");
    }
  };

  const handleCall = async () => {
    if (!user) { setCallStatus("You must be logged in to call a contract."); return; }
    setCallStatus("Calling method...");
    try {
      const args = JSON.parse(callArgs);
      const res = await fetch("https://axion-digitaverse-3.onrender.com/api/contract/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: callAddress, method: callMethod, args, caller: user.address, miner: selectedMiner }),
      });
      const data = await res.json();
      if (res.ok) {
        setCallStatus(`Call successful.`);
        setOutput(`Result from ${callMethod}:\n${JSON.stringify(data.result, null, 2)}`);
      } else {
        setCallStatus(`Error: ${data.error}`);
      }
    } catch (e) {
      setCallStatus("Invalid method arguments. Please provide a valid JSON array.");
    }
  };

  return (
    <div className="d-flex vh-100 bg-dark text-white">
      <div className="d-flex flex-column" style={{ width: 280 }}>
        <ul className="nav nav-tabs nav-fill">
          <li className="nav-item"><button className={`nav-link ${activeTab === 'files' ? 'active' : 'text-white'}`} onClick={() => setActiveTab('files')}>Files</button></li>
          <li className="nav-item"><button className={`nav-link ${activeTab === 'contracts' ? 'active' : 'text-white'}`} onClick={() => setActiveTab('contracts')}>Contracts</button></li>
        </ul>
        <div className="p-2 overflow-auto flex-grow-1">
          {activeTab === 'files' && (
            <div>
              <FileTree tree={tree} onSelect={setSelected} selected={selected} />
              <hr/>
              <div className="input-group mb-2">
                <input className="form-control form-control-sm" placeholder="path/to/file.py" value={newPath} onChange={e => setNewPath(e.target.value)} />
              </div>
              <button className="btn btn-sm btn-primary w-100 mb-2" onClick={() => handleCreate(false)}><FaPlus className="me-2"/>Create File</button>
              <button className="btn btn-sm btn-secondary w-100 mb-2" onClick={() => handleCreate(true)}><FaFolder className="me-2"/>Create Folder</button>
              <button className="btn btn-sm btn-danger w-100" onClick={handleDelete} disabled={!selected}><FaTrash className="me-2"/>Delete Selected</button>
            </div>
          )}
          {activeTab === 'contracts' && (
            <div>
              {!user ? <div className='alert alert-warning'>Please log in to interact with contracts.</div> :
              <>
                <h5 className="text-success"><FaCloudUploadAlt className="me-2"/>Deploy Contract</h5>
                <p className="small">Deploy the code in the current editor to the blockchain.</p>
                <div className="mb-2">
                    <label className="form-label small">Constructor Args (JSON)</label>
                    <input className="form-control form-control-sm" value={constructorArgs} onChange={e => setConstructorArgs(e.target.value)} />
                </div>
                <div className="mb-3">
                    <label className="form-label small"><FaServer className="me-2"/>Miner</label>
                    <select className="form-select form-select-sm" value={selectedMiner} onChange={e => setSelectedMiner(e.target.value)} disabled={miners.length === 0}>
                        {miners.length > 0 ? miners.map(m => <option key={m} value={m}>{m.substring(0,10)}...{m.substring(m.length-10)}</option>) : <option>No miners registered</option>}
                    </select>
                </div>
                <button className="btn btn-success w-100" onClick={handleDeploy}>Deploy</button>
                {deployStatus && <div className="alert alert-info small mt-2 p-2">{deployStatus}</div>}
                
                <hr className="my-4"/>
                
                <h5 className="text-info"><FaPhoneAlt className="me-2"/>Call Contract Method</h5>
                <div className="mb-2">
                    <label className="form-label small">Contract Address</label>
                    <input className="form-control form-control-sm" value={callAddress} onChange={e => setCallAddress(e.target.value)} />
                </div>
                <div className="mb-2">
                    <label className="form-label small">Method Name</label>
                    <input className="form-control form-control-sm" value={callMethod} onChange={e => setCallMethod(e.target.value)} />
                </div>
                <div className="mb-2">
                    <label className="form-label small">Method Args (JSON)</label>
                    <input className="form-control form-control-sm" value={callArgs} onChange={e => setCallArgs(e.target.value)} />
                </div>
                <div className="mb-3">
                    <label className="form-label small"><FaServer className="me-2"/>Miner</label>
                    <select className="form-select form-select-sm" value={selectedMiner} onChange={e => setSelectedMiner(e.target.value)} disabled={miners.length === 0}>
                        {miners.length > 0 ? miners.map(m => <option key={m} value={m}>{m.substring(0,10)}...{m.substring(m.length-10)}</option>) : <option>No miners registered</option>}
                    </select>
                </div>
                <button className="btn btn-info w-100" onClick={handleCall}>Call Method</button>
                {callStatus && <div className="alert alert-info small mt-2 p-2">{callStatus}</div>}
              </>
            }
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-grow-1 d-flex flex-column">
        <div className="d-flex align-items-center p-2 bg-secondary border-bottom border-dark">
          <span className="fw-bold me-auto">{selected || "No file selected"}</span>
          <button className="btn btn-sm btn-success me-2" onClick={handleSave} disabled={!selected}><FaSave className="me-2"/>Save</button>
          <button className="btn btn-sm btn-primary" onClick={handleRun} disabled={!selected || !selected.endsWith(".py")}><FaPlay className="me-2"/>Run</button>
        </div>
        <textarea
          className="form-control flex-grow-1 bg-dark text-light border-0"
          style={{ fontFamily: "monospace", fontSize: 15, borderRadius: 0 }}
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={!selected}
          placeholder="Select a file or create a new one to start coding..."
        />
        <div style={{ minHeight: 150, background: "#111", color: "#0f0", fontFamily: "monospace", padding: 12, overflowY: 'auto' }}>
          <b className="text-white">Output:</b>
          <pre className="m-0">{output}</pre>
        </div>
      </div>
    </div>
  );
}

export default PythonIDE;
