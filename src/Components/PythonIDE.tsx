import { useEffect, useState } from "react";

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
    <ul style={{ listStyle: "none", paddingLeft: 16 }}>
      {tree.map((item) =>
        item.type === "folder" ? (
          <li key={prefix + item.name}>
            <span style={{ fontWeight: "bold" }}>📁 {item.name}</span>
            <FileTree
              tree={item.children || []}
              onSelect={onSelect}
              selected={selected}
              prefix={prefix + item.name + "/"}
            />
          </li>
        ) : (
          <li key={prefix + item.name}>
            <button
              style={{
                background: selected === prefix + item.name ? "#e0e0e0" : "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px 8px",
                width: "100%",
                textAlign: "left",
              }}
              onClick={() => onSelect(prefix + item.name)}
            >
              📝 {item.name}
            </button>
          </li>
        )
      )}
    </ul>
  );
}

function PythonIDE() {
  const [tree, setTree] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [plugins, setPlugins] = useState<any[]>([]);
  const [newFile, setNewFile] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [refresh, setRefresh] = useState(0);

  // Load file tree
  useEffect(() => {
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/tree")
      .then(res => res.json())
      .then(setTree);
  }, [refresh]);

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

  // Load plugins
  useEffect(() => {
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/plugins")
      .then(res => res.json())
      .then(setPlugins);
  }, []);

  const saveFile = () => {
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selected, content }),
    }).then(() => setRefresh(r => r + 1));
  };

  const runFile = () => {
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selected }),
    })
      .then(res => res.json())
      .then(data => setOutput(data.output || ""));
  };

  const testWorkspace = () => {
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/test", {
      method: "POST",
    })
      .then(res => res.json())
      .then(data => setOutput(data.output || ""));
  };

  const createFile = () => {
    if (!newFile) return;
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: newFile, isFolder: false }),
    }).then(() => {
      setNewFile("");
      setRefresh(r => r + 1);
    });
  };

  const createFolder = () => {
    if (!newFolder) return;
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: newFolder, isFolder: true }),
    }).then(() => {
      setNewFolder("");
      setRefresh(r => r + 1);
    });
  };

  const deleteSelected = () => {
    if (!selected) return;
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selected }),
    }).then(() => {
      setSelected("");
      setRefresh(r => r + 1);
    });
  };

  const installPlugin = (plugin: string) => {
    fetch("https://axion-digitaverse-3.onrender.com/api/ide/plugins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plugin }),
    }).then(() => alert(`Plugin ${plugin} installed (demo)`));
  };

  return (
    <div className="d-flex" style={{ height: "80vh", background: "#f8f9fa" }}>
      {/* File Explorer */}
      <div style={{ width: 240, borderRight: "1px solid #ddd", padding: 12, overflowY: "auto" }}>
        <h6>Files</h6>
        <FileTree tree={tree} onSelect={setSelected} selected={selected} />
        <div className="mt-3">
          <input
            className="form-control form-control-sm mb-1"
            placeholder="New file.py"
            value={newFile}
            onChange={e => setNewFile(e.target.value)}
          />
          <button className="btn btn-sm btn-primary w-100 mb-2" onClick={createFile}>
            + Create File
          </button>
          <input
            className="form-control form-control-sm mb-1"
            placeholder="New folder"
            value={newFolder}
            onChange={e => setNewFolder(e.target.value)}
          />
          <button className="btn btn-sm btn-secondary w-100" onClick={createFolder}>
            + Create Folder
          </button>
          <button className="btn btn-sm btn-danger w-100 mt-2" onClick={deleteSelected} disabled={!selected}>
            Delete Selected
          </button>
        </div>
        <div className="mt-4">
          <h6>Plugins</h6>
          <ul className="list-group">
            {plugins.map((p: any) => (
              <li key={p.name} className="list-group-item d-flex justify-content-between align-items-center">
                <span>
                  <b>{p.name}</b> <span className="badge bg-secondary ms-2">{p.type}</span>
                </span>
                <button className="btn btn-sm btn-outline-primary" onClick={() => installPlugin(p.name)}>
                  Install
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Editor and Output */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <div className="d-flex align-items-center p-2 bg-light border-bottom">
          <span className="fw-bold me-3">{selected || "No file selected"}</span>
          <button className="btn btn-sm btn-success me-2" onClick={saveFile} disabled={!selected}>
            Save
          </button>
          <button className="btn btn-sm btn-primary me-2" onClick={runFile} disabled={!selected || !selected.endsWith(".py")}>
            Run
          </button>
          <button className="btn btn-sm btn-warning me-2" onClick={testWorkspace}>
            Test Workspace
          </button>
        </div>
        <textarea
          className="form-control flex-grow-1"
          style={{ fontFamily: "monospace", fontSize: 15, border: "none", borderRadius: 0 }}
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={!selected}
        />
        <div style={{ minHeight: 120, background: "#222", color: "#0f0", fontFamily: "monospace", padding: 8 }}>
          <b>Output:</b>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{output}</pre>
        </div>
      </div>
    </div>
  );
}

export default PythonIDE;